class RoomAPI {
    constructor(fetch){
        this.fetch = fetch;
    }

    async getRoomData(roomId){
        let resp = await this.fetch("/api/v1/room/"+roomId);
        if(resp.ok){
            let result = await resp.json();
            return result;
        }else{
            let error = await resp.text();
            throw error;
        }
    }

}

export default RoomAPI;