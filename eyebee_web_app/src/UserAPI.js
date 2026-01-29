class UserAPI {
    constructor(fetch){
        this.fetch = fetch;
    }

    async getUserData(userId){
        let resp = await this.fetch("https://livelatency.com/api/v1/user/"+userId);
        if(resp.ok){
            let result = await resp.json();
            return result;
        }else{
            let error = await resp.text();
            throw error;
        }
    }

}

export default UserAPI;