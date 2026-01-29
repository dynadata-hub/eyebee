class MemoryDatabaseAPI {
    
    constructor(){
        this.collections = {};
    }

    set(col,docId,data){
        if(!this.collections[col]){
            this.collections[col] = {};
        }
        this.collections[col][docId] = data;
        return this.collections[col][docId];
    }

    generateCollectionId(col){
        let keys = Object.keys(this.collections[col]);
        let newKey = null;
        if(keys.length > 0){
           newKey = keys[keys.length - 1] + 1;
        }else{
            newKey = 1;
        }
        return newKey;
    }

    add(col,data){
        if(!this.collections[col]){
            this.collections[col] = {};
        }
        let key = this.generateCollectionId(col);
        if(!this.collections[col]){
            this.collections[col] = {};
        }
        this.collections[col][key] = data;
        return data;
    }

    async insert(collectionName,docId,docData){
        try{
            let newDoc = null;
            if(docId){
                newDoc = this.set(collectionName,docId,docData); 
            }else{
                newDoc = this.add(collectionName,docData);
            }
            
            return newDoc;
        }catch(err){
            throw err;
        }
    }

    async findById(collectionName,docId){
        try{
            
            return  this.collections[collectionName] ? this.collections[collectionName][docId] : null;            
        }catch(err){
            throw err;
        }
    }

    async getAll(collectionName){
        try{
            return  this.collections[collectionName];            
        }catch(err){
            throw err;
        }
    }

    async deleteById(collectionName,docId){
        try{
            if(this.collections[collectionName] && this.collections[collectionName][docId]){
                delete this.collections[collectionName][docId];
            }
            
            return true;             
        }catch(err){
            throw err;
        }
    }

    merge(to, from) {

        for (let n in from) {
    
            if (typeof to[n] != 'object') {
                to[n] = from[n];
            } else if (typeof from[n] == 'object') {
                to[n] = this.merge(to[n], from[n]);
            }
        }
        return to;
    };

    async updateById(collectionName,docId,updateObj){
        try{

            let doc =  this.collections[collectionName][docId];
            if(doc){
                let upKeys = Object.keys(updateObj);
                upKeys.forEach(e => {
                    doc[e] = upKeys[e];
                });
                if(this.collections[collectionName][docId]){
                    this.collections[collectionName][docId] = doc;
                }
            }
            
            return true;             
        }catch(err){
            throw err;
        }
    }

    async updateMergeById(collectionName,docId,updateObj){
        try{
            let doc =  this.collections[collectionName][docId];
            if(doc){
                let newDoc = this.merge(doc,updateObj);
                if(this.collections[collectionName][docId]){
                    this.collections[collectionName][docId] = newDoc;
                }
            }
            
            return true;             
        }catch(err){
            throw err;
        }
    }

    async queryCollection(collectionName,map,select,orderBy,cursorObj,limitValue){
        let finalDocs = null;
        if(map && map.length > 0){
            if(map.length > 0){
                for(let i=0; i< map.length; i++){
                    let queryDocs = (finalDocs ? { ...finalDocs } : null) || this.collections[collectionName];

                    finalDocs = {};
                    if(queryDocs){
                        Object.keys(queryDocs).forEach(e => {
                        
                        
                            switch(map[i].operator){
                                case ">": 
                                    if(this.collections[collectionName][e] && this.collections[collectionName][e][map[i].field] > map[i].value){
                                        finalDocs[e] = this.collections[collectionName][e];
                                    }
                                    break;
                                case "!=": 
                                    if(this.collections[collectionName][e] && this.collections[collectionName][e][map[i].field] != map[i].value){
                                        finalDocs[e] = this.collections[collectionName][e];
                                    }
                                    break;
                                default: 
                                    if(this.collections[collectionName][e] && this.collections[collectionName][e][map[i].field] === map[i].value){
                                        finalDocs[e] = this.collections[collectionName][e];
                                    }
                            }
                        });
    
                        //console.log("query como queda finalDocs",{finalDocs:finalDocs});
                    }

                   
                }
            }
            
        }

        return finalDocs;
    }

}

module.exports = MemoryDatabaseAPI;