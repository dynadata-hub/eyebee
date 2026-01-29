class SocketIOProvider {
    constructor(socketIOClient){
        this.socketIOClient = socketIOClient;
    }

    createClient(serverURL,connOption){
        let client = this.socketIOClient(serverURL, connOption);
        return client;
    }
}

export default SocketIOProvider;