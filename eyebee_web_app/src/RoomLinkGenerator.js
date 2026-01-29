class RoomLinkGenerator {
    constructor(window,crypto){
        this.window = window;
        this.crypto = crypto;

    }

    generateLinks(roomId,extraParams){
        let rId = roomId;
        if(!roomId){
            rId=Math.floor(Math.random()*1000000)
        }
        let extraQS = "";
        extraQS = Object.keys(extraParams).map(e => {
            return e+"="+extraParams[e];
        }).join("&");

        let mainLink = `${this.window.location.origin}/videocall/${rId}`;

        let mQS=  extraParams.largeRoom ? "owner=true&presenter=true" : "owner=true&presenter=true&testDisabled=true&sfu=true" ;
        mQS = extraQS ? mQS+"&"+extraQS: "";

        let pQS=  extraParams.largeRoom ? "presenter=true": "presenter=true&testDisabled=true&sfu=true" ;
        pQS = extraQS ? pQS+"&"+extraQS: "";

        let rQS=  extraParams.largeRoom ? "presenter=false": "presenter=false&testDisabled=true&sfu=true" ;
        rQS = extraQS ? rQS+"&"+extraQS: "";

        let nQS=  "presenter=true&testDisabled=true&sfu=false";
        nQS = extraQS ? nQS+"&"+extraQS: "";

        const paramsM = this.crypto.AES.encrypt(mQS, "human hive eyebee").toString();
        
        const paramsP = this.crypto.AES.encrypt(pQS, "human hive eyebee").toString();
        
        const paramsR = this.crypto.AES.encrypt(rQS, "human hive eyebee").toString();
        const paramsN = this.crypto.AES.encrypt(nQS, "human hive eyebee").toString();
    
        return {
            owner: mainLink+"?p="+paramsM,
            presenters:mainLink+"?p="+paramsP,
            spectators: mainLink+"?p="+paramsR,
            noTestNoSFU:mainLink+"?p="+paramsN
        }
    }
}

export default RoomLinkGenerator;