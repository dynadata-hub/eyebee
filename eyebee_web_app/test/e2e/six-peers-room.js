const puppeteer = require('puppeteer-core');
const PeerJoin = require("./peer-join");

const peerSessions   = [];

(async () => {
  
  let f1 = new PeerJoin("f1",puppeteer,"http://localhost:3000/videocall/1?peer_id=f1&owner=true"+
  "&presenter=true&testDisabled=true&sfu=true&test_stream=test")
  // await f1.loadURL();
  // await f1.joinRoom();
  f1.loadAndJoin();
  await f1.page.waitFor(1000);
  peerSessions.push(f1);

  let f2 = new PeerJoin("f2",puppeteer,"http://localhost:3000/videocall/1?peer_id=f2"+
  "&presenter=true&testDisabled=true&sfu=true&test_stream=test")
  // await f2.loadURL();
  // await f2.joinRoom();
  f2.loadAndJoin();
  peerSessions.push(f2);
  await f2.page.waitFor(1000);

  // let f3 = new PeerJoin("f3",puppeteer,"http://localhost:3000/videocall/1?peer_id=f2"+
  // "&presenter=true&testDisabled=true&sfu=true&test_stream=test")
  // // await f2.loadURL();
  // // await f2.joinRoom();
  // f3.loadAndJoin();
  // peerSessions.push(f3);
  // f3.page.waitFor(1000);
  

  console.log("loaded all peers "+peerSessions.length );

})();

const closeAllPeerBrowsers = async () => {

  for (let i = 0; i < peerSessions.length; i++) {
    const p = peerSessions[i];
    console.log("closing peer's browser: "+p.label);
    await p.closeBrowser();
    
  }

  return peerSessions;
}

process.on("SIGTERM", () => {
  closeAllPeerBrowsers().then(ps => {
    console.log("finished");
  }).catch(err => {
    console.log("error closing all peer browsers")
    console.error(err);
  });
  
}); 