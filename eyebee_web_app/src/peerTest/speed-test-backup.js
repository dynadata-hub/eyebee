class SpeedTest {

    constructor(config){
        this.config = config || {
            testFile: '/speedtest/download/50mb.bin',
            uploadEndpoint: '/speedtest/upload',
            targetTime: 20 * 1000, 
            negotiationSize: 1024 * 1024 * 5, // 5 MByte
        };
    }

    downloadChunk(url, start, end, cfg) {
        const req = new XMLHttpRequest();
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
        });

        req.open('GET', url, true);
        req.setRequestHeader("Range", "bytes=" + start + "-" + end);

        if (cfg) {
            cfg(req);
        }

        req.send(null);

        return promise;
    }

    uploadChunk(url, blob, start, end, cfg) {
        const req = new XMLHttpRequest();
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
        });

        req.open("POST", url, true);

        if (cfg) {
            cfg(req);
        }

        req.send(blob.slice(start, end));

        return promise;
    };

    of(value) {
        return new Promise(resolve => resolve(value));
    }

    updateDetails(details, ev) {
        if (ev.lengthComputable && ev.total > 0) {
            // update download test progress
            details.now = performance.now();
            const Bps = ev.loaded / ((details.now - details.start) / 1000);
            details.currentMbit = Bps / 1024 / 1024 * 8;

            details.measureCounter++;
            details.measureSum += details.currentMbit;

            details.averageMbit = details.measureSum / details.measureCounter;
            details.percent = ev.loaded / ev.total * 100.0;
            details.eta = (ev.total - ev.loaded) / Bps;

            return true;
        }
        return false;
    }

    runTest() {
        let prom = new Promise((resolve,reject) => {
            // run now
            const beginTime = performance.now();

            console.group('Test Download...');
            console.info('Begin to negotiate download size...');

            let downloadEventName = "download_test";
            let uploadEventName = "upload_test";

            let results = {
                "download":{},
                "upload":{}
            }

            const details =
            {
                message: null,
                done: false,
                start: null,
                now: null,
                measureCounter: 0,
                measureSum: 0,
                currentMbit: 0,
                averageMbit: 0,
                eta: 0,
                percent: 0
            };

            details.message = 'Negotiate...';

            return this.downloadChunk(this.config.testFile + '?' + Date.now(), 1, this.config.negotiationSize).then(() => {
                // use the download stats to calculate the real test size
                const duration = performance.now() - beginTime;
                const newEndIndex = Math.round(this.config.negotiationSize / duration * this.config.targetTime) + this.config.negotiationSize;

                console.log('Took ', Math.round(duration * 100) / 100, 'ms for downloading ', Math.round(this.config.negotiationSize / 1024 / 1024 * 100) / 100, 'MB of test data');
                console.log('Use ', Math.round(newEndIndex / 1024 / 1024 * 100) / 100, 'MB for testing ', Math.round(this.config.targetTime / 100) / 10, ' seconds');

                return this.of(newEndIndex);
            })
            .then(newEndIndex => {
                // Download speed test
                details.start = performance.now();
                details.message = "Test download...";

                return this.downloadChunk(this.config.testFile + '?' + Date.now(), 1, newEndIndex, req => {
                    req.addEventListener('progress', ev => {
                        if (this.updateDetails(details, ev)) {
                           
                        }
                    });
                });
            })
            .then(res => {
                // Finalize download speedtest
                details.now = performance.now();
                details.message = "Done!";
                details.done = true;
            

                console.log('Download: ', Math.round(details.averageMbit * 100) / 100, ' MBit/sec');
                console.log(details);
                console.groupEnd();

                results["download"] = {
                    name:"Download",
                    stats:{
                        mean : Math.round(details.averageMbit * 100) / 100 
                    }
                }

                // transfer blob to upload test
                return this.of(res.target.response);
            })
            .then(blob => {
                const uploadBegin = performance.now();

                console.group('Test Upload...');
                console.info('Begin to negotiate upload size...');

                return this.uploadChunk(this.config.uploadEndpoint + '?' + Date.now(), blob, 1, this.config.negotiationSize).then(() => {
                    // use the upload stats to calculate the real test size
                    const duration = performance.now() - uploadBegin;
                    const newEndIndex = Math.round(this.config.negotiationSize / duration * this.config.targetTime) + this.config.negotiationSize;

                    console.log('Took ', Math.round(duration * 100) / 100, 'ms for uploading ', Math.round(this.config.negotiationSize / 1024 / 1024 * 100) / 100, 'MB of test data');
                    console.log('Use ', Math.round(newEndIndex / 1024 / 1024 * 100) / 100, 'MB for testing ', Math.round(this.config.targetTime / 100) / 10, ' seconds');

                    return this.of({ length: newEndIndex, blob: blob });
                });
            })
            .then(negInfo => {
                // Upload speed test
                details.start = performance.now();
                details.now = null;
                details.done = false;
                details.message = "Test upload...";

                details.measureCounter = 0;
                details.measureSum = 0;
                details.currentMbit = 0;
                details.averageMbit = 0;
                details.eta = 0;
                details.percent = 0;

                return this.uploadChunk(this.config.uploadEndpoint + '?' + Date.now(), negInfo.blob, 1, negInfo.length, req => {
                    req.upload.addEventListener('progress', ev => {
                        if (this.updateDetails(details, ev)) {
                            
                        }
                    });
                });
            })
            .then(res => {
                // Finalize upload speedtest
                details.now = performance.now();
                details.message = "Done!";
                details.done = true;
               

                console.log('Upload: ', Math.round(details.averageMbit * 100) / 100, ' MBit/sec');
                console.log(details);
                console.groupEnd();

                results["upload"] = {
                    name:"Upload",
                    stats:{
                        mean : Math.round(details.averageMbit * 100) / 100 
                    }
                }

                

                resolve(results);
            });
        });
        return prom;
        
    }

}

export default SpeedTest;