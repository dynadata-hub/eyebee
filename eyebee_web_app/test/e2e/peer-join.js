class PeerJoin {
    constructor(label,puppeteer,url){
        this.label = label;
        this.puppeteer = puppeteer;
        this.url = url;
        this.browser = null;
        this.page = null;
    }

    async loadURL(){

        this.browser = await this.puppeteer.launch({
            headless:false,
            defaultViewport: null,
            executablePath:"/opt/google/chrome/chrome",
            args: ['--start-maximized'],
            devtools:true
        });
        this.page = (await this.browser.pages())[0];
        await this.page.goto(this.url);

        return this.page;
    }

    async joinRoom(){
        await this.page.waitForSelector("#joinBtn");
        console.log("encuentra el join btn! "+this.url);
        await this.page.click("#joinBtn");
        
        return true;
    }

    async loadAndJoin(){
        await this.loadURL();
        await this.joinRoom();
    }


    async closeBrowser(){
        await this.browser.close();
        return true;
    }

}

module.exports = PeerJoin;