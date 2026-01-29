class SpeedTest {

    constructor(config){
        this.config = config || {
            testFile: 'https://livelatency.com/speedtest/download/500mb.bin',
            uploadEndpoint: 'https://livelatency.com/speedtest/upload',
            targetTime: 14 * 1000, 
            negotiationSize: 1024 * 1024 * 5, // 5 MByte
        };
    }

    async latencyTest(abortController,abortTimeout){
        let before = performance.now();

        let abort =  setTimeout(() => {
            abortController.abort();
        },abortTimeout || 5000);

        await fetch("https://livelatency.com/speedtest/ping",{
            signal: abortController.signal,
            cache: "no-store"
        });

        clearTimeout(abort);

        return performance.now() - before;
    }

    downloadChunk(url, start, end,req, cfg) {
   
        req.responseType = 'blob';

        const promise = new Promise((resolve, reject) => {
            req.onreadystatechange = ev => {

                if (req.readyState !== 4) {
                    return;
                }

                if ((req.status >= 200 && req.status < 300) ) {
                   
                    resolve(ev);
                }
                else {
                   
                    reject(ev);
                }
            };

            req.onerror = ev => {
               
                reject(ev);
            };


            req.onabort = ev => {
                console.debug("downloadChunk -- request aborted..resolving anyway",{
                    url, start, end,req, cfg
                });
                resolve(ev);
            }
        });

        req.open('GET', url, true);
        req.setRequestHeader("Range", "bytes=" + start + "-" + end);

        if (cfg) {
            cfg(req);
        }
      
        req.send(null);

        return promise;
    }

    uploadChunk(url, blob, start, end,req, cfg) {

        req.responseType = 'blob';

        const promise = new Promise((resolve, reject) => {
            req.onreadystatechange = ev => {
                if (req.readyState !== 4) {
                    return;
                }

                if (req.status >= 200 && req.status < 300) {
                    resolve(ev);
                }
                else {
                    reject(ev);
                }
            };

            req.onerror = ev => {
                reject(ev);
            };

            req.onabort = ev => {
                console.debug("uploadChunk -- request aborted...resolving anyway",{
                    url, start, end,req, cfg
                });
                resolve(ev);
            }
        });

        req.open("POST", url, true);

        if (cfg) {
            cfg(req);
        }

        req.send(blob.slice(start, end));

        return promise;
    };

    getAverageMeasure(measures){
        let acum = 0;
        measures.forEach(e => {
            acum += e;
        });
        return acum / measures.length;
    }

    updateDetails(details, ev) {
        if (ev.lengthComputable && ev.total > 0) {
            // update download test progress
            details.now = performance.now();

            const Bps = ev.loaded / ((details.now - details.start) / 1000);
            details.currentMbit = (Bps / 1024 / 1024) * 8;

            details.measureCounter++;
            details.measureSum += details.currentMbit;

            details.lastMeasures.unshift(details.currentMbit);
            if(details.lastMeasures.length > details.maxMeasures){
                details.lastMeasures.pop();
            }

            //details.averageMbit = details.measureSum / details.measureCounter;

            details.averageMbit = this.getAverageMeasure(details.lastMeasures);
            details.percent = ev.loaded / ev.total * 100.0;
            details.eta = (ev.total - ev.loaded) / Bps;

            return true;
        }
        return false;
    }

    async runTest(maxTimeMillis) {

        // run now
        const beginTimeDL = performance.now();

        console.group('Test Download...');
        console.info('Begin to negotiate download size...');

        let results = {
            "download":{
                name:"Download",
                value:0
            },
            "upload":{
                name:"Upload",
                value:0
            }
        }

        const detailsDL =
        {
            message: null,
            done: false,
            start: null,
            now: null,
            lastMeasures:[],
            maxMeasures:5,
            measureCounter: 0,
            measureSum: 0,
            currentMbit: 0,
            averageMbit: 0,
            eta: 0,
            percent: 0
        };

        const detailsUL =
        {
            message: null,
            done: false,
            start: null,
            now: null,
            lastMeasures:[],
            maxMeasures:5,
            measureCounter: 0,
            measureSum: 0,
            currentMbit: 0,
            averageMbit: 0,
            eta: 0,
            percent: 0
        };

        detailsDL.message = 'Negotiate...';
        let negDLReq = new XMLHttpRequest();
        let negDLTimeout = null;
        if(maxTimeMillis > 0){
            negDLTimeout = setTimeout(() => {
                console.debug("max time reached..aborting download test",{maxTime:maxTimeMillis});
                negDLReq.abort();
            },maxTimeMillis);
        }
       
        try{
            await this.downloadChunk(this.config.testFile + '?' + Date.now(), 1, this.config.negotiationSize,negDLReq);
        }catch(err){
            console.debug("runTest -- error when negotiating download chunk size",{err:err});
        }finally{
            clearTimeout(negDLTimeout);
        }
        
        const durationDL = performance.now() - beginTimeDL;
        const newEndIndexDL = Math.round(this.config.negotiationSize / durationDL * this.config.targetTime) + this.config.negotiationSize;

        console.debug('Took ', Math.round(durationDL * 100) / 100, 'ms for downloading ', Math.round(this.config.negotiationSize / 1024 / 1024 * 100) / 100, 'MB of test data');
        console.debug('Use ', Math.round(newEndIndexDL / 1024 / 1024 * 100) / 100, 'MB for testing ', Math.round(this.config.targetTime / 100) / 10, ' seconds');
        
        detailsDL.start = performance.now();
        detailsDL.message = "Test download...";

        let dlReq = new XMLHttpRequest();
        let dlTimeout = null;
        if(maxTimeMillis > 0){
            dlTimeout = setTimeout(() => {
                console.debug("max time reached..aborting download test",{maxTime:maxTimeMillis});
                dlReq.abort();
            },maxTimeMillis);
        }
        
        let res = null;
        try{
            res = await this.downloadChunk(this.config.testFile + '?' + Date.now(), 1, newEndIndexDL,dlReq, req => {
                req.addEventListener('progress', ev => {
                    if (this.updateDetails(detailsDL, ev)) {
                       
                    }
                });
            });
        }catch(err){
            console.debug("runTest -- error when running download test",{err});
            clearTimeout(dlTimeout);
            
        }finally{
            clearTimeout(dlTimeout);
        }

        // Finalize download speedtest
        detailsDL.now = performance.now();
        detailsDL.message = "Done!";
        detailsDL.done = true;
    
        console.debug(detailsDL);
        console.groupEnd();

        results["download"] = {
            name:"Download",
            value:  Math.round(detailsDL.averageMbit * 100) / 100
        }

        //upload test begins

        const uploadBegin = performance.now();

        console.group('Test Upload...');
        console.info('Begin to negotiate upload size...');

        let negULReq = new XMLHttpRequest();
        let negULTimeout = null;
        if(maxTimeMillis > 0){
            negULTimeout = setTimeout(() => {
                console.debug("max time reached..aborting uploading test",{maxTime:maxTimeMillis});
                negULReq.abort();
            },maxTimeMillis);
        }

        if(res){
            let blob = res.target.response;

            try{
                await this.uploadChunk(this.config.uploadEndpoint + '?' + Date.now(), blob, 1, this.config.negotiationSize,negULReq);
            }catch(err){
                console.debug("runTest -- error when negotiating upload size",{err});
                clearTimeout(negULTimeout);
               
            }finally{
                clearTimeout(negULTimeout);
            }
    
            const durationUL = performance.now() - uploadBegin;
            const newEndIndexUL = Math.round(this.config.negotiationSize / durationUL * this.config.targetTime) + this.config.negotiationSize;
    
            let uploadNegInfo = { length: newEndIndexUL, blob: blob };
    
            // Upload speed test
            detailsUL.start = performance.now();
            detailsUL.now = null;
            detailsUL.done = false;
            detailsUL.message = "Test upload...";
    
            detailsUL.measureCounter = 0;
            detailsUL.measureSum = 0;
            detailsUL.currentMbit = 0;
            detailsUL.averageMbit = 0;
            detailsUL.eta = 0;
            detailsUL.percent = 0;
    
            let ulReq = new XMLHttpRequest();
            let ulTimeout = null;
            if(maxTimeMillis > 0){
                ulTimeout = setTimeout(() => {
                    console.debug("max time reached..aborting upload test",{maxTime:maxTimeMillis});
                    ulReq.abort();
                },maxTimeMillis);
            }
    
            try{
                await this.uploadChunk(this.config.uploadEndpoint + '?' + Date.now(), uploadNegInfo.blob, 1, uploadNegInfo.length,ulReq, req => {
                    req.upload.addEventListener('progress', ev => {
                        if (this.updateDetails(detailsUL, ev)) {
                            
                        }
                    });
                });
            }catch(err){
                console.debug("runTest -- error trying to uploadChunk",{err:err});
                clearTimeout(ulTimeout);
               
            }finally{
                clearTimeout(ulTimeout);
                
                // Finalize upload speedtest
                detailsUL.now = performance.now();
                detailsUL.message = "Done!";
                detailsUL.done = true;
    
                console.debug('Upload: ', Math.round(detailsUL.averageMbit * 100) / 100, ' MBit/sec');
                console.debug(detailsUL);
                console.groupEnd();
    
                results["upload"] = {
                    name:"Upload",
                    value:Math.round(detailsUL.averageMbit * 100) / 100
                }
    
                return results;  
    
            }
        }else{
            throw new Error("PEER_TEST_FAILED");
        }
        
        //return results;        
    }

}

export default SpeedTest;