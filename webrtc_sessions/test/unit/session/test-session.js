const Session = require("../../../session");

const expect = require("chai").expect;


const streamPaths = require("./test-session-stream-paths.js");

describe("session.js",() => {

    describe("removePeerStreamReferences()",() => {
        it("expects to remove the given peerId and streamId on upstream and downstream fields from the rest of peers ",() => {
            let session = new Session();

            /*

            scenario (in order of connection): f1 (sfu) ; f2 (sfu) ; f3 

            */

            let peers = {
                "f": {
                  "downstream": {
                    "f2": {
                      "636e164a-dcb9-4161-a1e4-9e1589ea5d59": {
                        "originPeerId": "f2",
                        "originStreamId": "636e164a-dcb9-4161-a1e4-9e1589ea5d59"
                      },
                      "0emfGZAgPxTQ9XjutewIwcNvFKgI41tQDx9K": {
                        "originPeerId": "f2",
                        "originStreamId": "0emfGZAgPxTQ9XjutewIwcNvFKgI41tQDx9K"
                      }
                    },
                    "f3": {
                      "4bb8f690-364e-4b77-9511-a8e310311fe6": {
                        "originPeerId": "f3",
                        "originStreamId": "4bb8f690-364e-4b77-9511-a8e310311fe6"
                      }
                    }
                  },
                  "upstream": {
                    "f2": {
                      "e1fe34c9-c88a-4212-a65c-419f3b910842": {
                        "originPeerId": "f",
                        "originStreamId": "e1fe34c9-c88a-4212-a65c-419f3b910842"
                      },
                      "4bb8f690-364e-4b77-9511-a8e310311fe6": {
                        "originPeerId": "f3",
                        "originStreamId": "4bb8f690-364e-4b77-9511-a8e310311fe6"
                      }
                    },
                    "f3": {
                      "636e164a-dcb9-4161-a1e4-9e1589ea5d59": {
                        "originPeerId": "f2",
                        "originStreamId": "636e164a-dcb9-4161-a1e4-9e1589ea5d59"
                      },
                      "0emfGZAgPxTQ9XjutewIwcNvFKgI41tQDx9K": {
                        "originPeerId": "f2",
                        "originStreamId": "0emfGZAgPxTQ9XjutewIwcNvFKgI41tQDx9K"
                      }
                    }
                  }
                },
                "f2": {
                  "upstream": {
                    "f": {
                      "636e164a-dcb9-4161-a1e4-9e1589ea5d59": {
                        "originPeerId": "f2",
                        "originStreamId": "636e164a-dcb9-4161-a1e4-9e1589ea5d59"
                      },
                      "0emfGZAgPxTQ9XjutewIwcNvFKgI41tQDx9K": {
                        "originPeerId": "f2",
                        "originStreamId": "0emfGZAgPxTQ9XjutewIwcNvFKgI41tQDx9K"
                      }
                    },
                    "f3": {
                      "e1fe34c9-c88a-4212-a65c-419f3b910842": {
                        "originPeerId": "f",
                        "originStreamId": "e1fe34c9-c88a-4212-a65c-419f3b910842"
                      }
                    }
                  },
                  "downstream": {
                    "f": {
                      "e1fe34c9-c88a-4212-a65c-419f3b910842": {
                        "originPeerId": "f",
                        "originStreamId": "e1fe34c9-c88a-4212-a65c-419f3b910842"
                      },
                      "4bb8f690-364e-4b77-9511-a8e310311fe6": {
                        "originPeerId": "f3",
                        "originStreamId": "4bb8f690-364e-4b77-9511-a8e310311fe6"
                      }
                    }
                  }
                },
                "f3": {
                  "upstream": {
                    "f": {
                      "4bb8f690-364e-4b77-9511-a8e310311fe6": {
                        "originPeerId": "f3",
                        "originStreamId": "4bb8f690-364e-4b77-9511-a8e310311fe6"
                      }
                    }
                  },
                  "downstream": {
                    "f2": {
                      "e1fe34c9-c88a-4212-a65c-419f3b910842": {
                        "originPeerId": "f",
                        "originStreamId": "e1fe34c9-c88a-4212-a65c-419f3b910842"
                      }
                    },
                    "f": {
                      "636e164a-dcb9-4161-a1e4-9e1589ea5d59": {
                        "originPeerId": "f2",
                        "originStreamId": "636e164a-dcb9-4161-a1e4-9e1589ea5d59"
                      },
                      "0emfGZAgPxTQ9XjutewIwcNvFKgI41tQDx9K": {
                        "originPeerId": "f2",
                        "originStreamId": "0emfGZAgPxTQ9XjutewIwcNvFKgI41tQDx9K"
                      }
                    }
                  }
                }
              }


            let peersFinal = {
                "f": {
                  "downstream": {
                    "f2": {
                      "636e164a-dcb9-4161-a1e4-9e1589ea5d59": {
                        "originPeerId": "f2",
                        "originStreamId": "636e164a-dcb9-4161-a1e4-9e1589ea5d59"
                      }
                    },
                    "f3": {
                      "4bb8f690-364e-4b77-9511-a8e310311fe6": {
                        "originPeerId": "f3",
                        "originStreamId": "4bb8f690-364e-4b77-9511-a8e310311fe6"
                      }
                    }
                  },
                  "upstream": {
                    "f2": {
                      "e1fe34c9-c88a-4212-a65c-419f3b910842": {
                        "originPeerId": "f",
                        "originStreamId": "e1fe34c9-c88a-4212-a65c-419f3b910842"
                      },
                      "4bb8f690-364e-4b77-9511-a8e310311fe6": {
                        "originPeerId": "f3",
                        "originStreamId": "4bb8f690-364e-4b77-9511-a8e310311fe6"
                      }
                    },
                    "f3": {
                      "636e164a-dcb9-4161-a1e4-9e1589ea5d59": {
                        "originPeerId": "f2",
                        "originStreamId": "636e164a-dcb9-4161-a1e4-9e1589ea5d59"
                      }
                    }
                  }
                },
                "f2": {
                  "upstream": {
                    "f": {
                      "636e164a-dcb9-4161-a1e4-9e1589ea5d59": {
                        "originPeerId": "f2",
                        "originStreamId": "636e164a-dcb9-4161-a1e4-9e1589ea5d59"
                      }
                    },
                    "f3": {
                      "e1fe34c9-c88a-4212-a65c-419f3b910842": {
                        "originPeerId": "f",
                        "originStreamId": "e1fe34c9-c88a-4212-a65c-419f3b910842"
                      }
                    }
                  },
                  "downstream": {
                    "f": {
                      "e1fe34c9-c88a-4212-a65c-419f3b910842": {
                        "originPeerId": "f",
                        "originStreamId": "e1fe34c9-c88a-4212-a65c-419f3b910842"
                      },
                      "4bb8f690-364e-4b77-9511-a8e310311fe6": {
                        "originPeerId": "f3",
                        "originStreamId": "4bb8f690-364e-4b77-9511-a8e310311fe6"
                      }
                    }
                  }
                },
                "f3": {
                  "upstream": {
                    "f": {
                      "4bb8f690-364e-4b77-9511-a8e310311fe6": {
                        "originPeerId": "f3",
                        "originStreamId": "4bb8f690-364e-4b77-9511-a8e310311fe6"
                      }
                    }
                  },
                  "downstream": {
                    "f2": {
                      "e1fe34c9-c88a-4212-a65c-419f3b910842": {
                        "originPeerId": "f",
                        "originStreamId": "e1fe34c9-c88a-4212-a65c-419f3b910842"
                      }
                    },
                    "f": {
                      "636e164a-dcb9-4161-a1e4-9e1589ea5d59": {
                        "originPeerId": "f2",
                        "originStreamId": "636e164a-dcb9-4161-a1e4-9e1589ea5d59"
                      }
                    }
                  }
                }
              }
    
            let originPeerId = "f2";
            let originStreamId = "0emfGZAgPxTQ9XjutewIwcNvFKgI41tQDx9K";
    
            let result = session.removePeerStreamReferences(peers,originPeerId,originStreamId);
    
            expect(JSON.stringify(result)).equals(JSON.stringify(peersFinal));
    
        });

        it("expects to remove the peerId that's leaving from the rest of peers ", () => {
            let session = new Session();

            /*

            scenario (in order of connection): f1 (sfu) ; f2 (sfu) ; f3 

            */

            let peers = {
                "f": {
                    "downstream": {
                        "f2": {
                            "636e164a-dcb9-4161-a1e4-9e1589ea5d59": {
                                "originPeerId": "f2",
                                "originStreamId": "636e164a-dcb9-4161-a1e4-9e1589ea5d59"
                            }
                        },
                        "f3": {
                            "4bb8f690-364e-4b77-9511-a8e310311fe6": {
                                "originPeerId": "f3",
                                "originStreamId": "4bb8f690-364e-4b77-9511-a8e310311fe6"
                            }
                        }
                    },
                    "upstream": {
                        "f2": {
                            "e1fe34c9-c88a-4212-a65c-419f3b910842": {
                                "originPeerId": "f",
                                "originStreamId": "e1fe34c9-c88a-4212-a65c-419f3b910842"
                            },
                            "4bb8f690-364e-4b77-9511-a8e310311fe6": {
                                "originPeerId": "f3",
                                "originStreamId": "4bb8f690-364e-4b77-9511-a8e310311fe6"
                            }
                        },
                        "f3": {
                            "636e164a-dcb9-4161-a1e4-9e1589ea5d59": {
                                "originPeerId": "f2",
                                "originStreamId": "636e164a-dcb9-4161-a1e4-9e1589ea5d59"
                            }
                        }
                    }
                },
                "f2": {
                    "upstream": {
                        "f": {
                            "636e164a-dcb9-4161-a1e4-9e1589ea5d59": {
                                "originPeerId": "f2",
                                "originStreamId": "636e164a-dcb9-4161-a1e4-9e1589ea5d59"
                            }
                        },
                        "f3": {
                            "e1fe34c9-c88a-4212-a65c-419f3b910842": {
                                "originPeerId": "f",
                                "originStreamId": "e1fe34c9-c88a-4212-a65c-419f3b910842"
                            }
                        }
                    },
                    "downstream": {
                        "f": {
                            "e1fe34c9-c88a-4212-a65c-419f3b910842": {
                                "originPeerId": "f",
                                "originStreamId": "e1fe34c9-c88a-4212-a65c-419f3b910842"
                            },
                            "4bb8f690-364e-4b77-9511-a8e310311fe6": {
                                "originPeerId": "f3",
                                "originStreamId": "4bb8f690-364e-4b77-9511-a8e310311fe6"
                            }
                        }
                    }
                },
                "f3": {
                    "upstream": {
                        "f": {
                            "4bb8f690-364e-4b77-9511-a8e310311fe6": {
                                "originPeerId": "f3",
                                "originStreamId": "4bb8f690-364e-4b77-9511-a8e310311fe6"
                            }
                        }
                    },
                    "downstream": {
                        "f2": {
                            "e1fe34c9-c88a-4212-a65c-419f3b910842": {
                                "originPeerId": "f",
                                "originStreamId": "e1fe34c9-c88a-4212-a65c-419f3b910842"
                            }
                        },
                        "f": {
                            "636e164a-dcb9-4161-a1e4-9e1589ea5d59": {
                                "originPeerId": "f2",
                                "originStreamId": "636e164a-dcb9-4161-a1e4-9e1589ea5d59"
                            }
                        }
                    }
                }
            }


            let peersFinal = {
                "f": {
                    "downstream": {
                        "f2": {
                            "636e164a-dcb9-4161-a1e4-9e1589ea5d59": {
                                "originPeerId": "f2",
                                "originStreamId": "636e164a-dcb9-4161-a1e4-9e1589ea5d59"
                            }
                        }
                    },
                    "upstream": {
                        "f2": {
                            "e1fe34c9-c88a-4212-a65c-419f3b910842": {
                                "originPeerId": "f",
                                "originStreamId": "e1fe34c9-c88a-4212-a65c-419f3b910842"
                            }
                        }
                    }
                },
                "f2": {
                    "upstream": {
                        "f": {
                            "636e164a-dcb9-4161-a1e4-9e1589ea5d59": {
                                "originPeerId": "f2",
                                "originStreamId": "636e164a-dcb9-4161-a1e4-9e1589ea5d59"
                            }
                        }
                    },
                    "downstream": {
                        "f": {
                            "e1fe34c9-c88a-4212-a65c-419f3b910842": {
                                "originPeerId": "f",
                                "originStreamId": "e1fe34c9-c88a-4212-a65c-419f3b910842"
                            }
                        }
                    }
                },
                "f3": {
                    "upstream": {
                    },
                    "downstream": {
                        "f2": {
                            "e1fe34c9-c88a-4212-a65c-419f3b910842": {
                                "originPeerId": "f",
                                "originStreamId": "e1fe34c9-c88a-4212-a65c-419f3b910842"
                            }
                        },
                        "f": {
                            "636e164a-dcb9-4161-a1e4-9e1589ea5d59": {
                                "originPeerId": "f2",
                                "originStreamId": "636e164a-dcb9-4161-a1e4-9e1589ea5d59"
                            }
                        }
                    }
                }
            }

            let originPeerId = "f3";
            let originStreamId = null;

            let result = session.removePeerStreamReferences(peers, originPeerId, originStreamId);

            expect(JSON.stringify(result)).equals(JSON.stringify(peersFinal));

        });
    });

    describe("electNewMainPresenter()",() => {
        it("expects to elect the second peer in the list as mainPresenter",() => {
            let session = new Session();

            let peers = {
                "f1":{
                    "id":"f1",
                    "presenter":true,
                    "mainPresenter":true
                },
                "f2":{
                    "id":"f2",
                    "presenter":true,
                }
            }

            let leavingPeerId = "f1";

            let newMainPresenter = session.electNewMainPresenter(peers,leavingPeerId);
            
            expect(newMainPresenter).not.to.be.null;
            expect(newMainPresenter.id).equals("f2");
            expect(newMainPresenter.mainPresenter).to.be.true;
        });


        

    });

    //describe("getStreamPaths",streamPaths.bind(this));
    
    describe("getUpstreamPeerIds()",() => {
      it("expects to get the right upstream Peers of peer f1 from peer f4",() => {

        let peers = require("./peers.json");
        let session = new Session();

        let originPeerId="f1";
        let originStreamId = "3f31e157-a496-4cf1-8930-ca85be892cc6";

        let fromPeer="f4";

        let expectedPeerIds = ["f5","f6"];

        let upstreamPeerIds = session.getUpstreamPeerIds(peers,fromPeer,originStreamId);

        expect(upstreamPeerIds).to.include.members(expectedPeerIds);


      });

      it("expects to get the right upstream Peers of peer f2 from peer f1",() => {

        let peers = require("./peers.json");
        let session = new Session();

        let originPeerId="f2";
        let originStreamId = "63cb0db3-4c9e-43a6-8c1e-3e405235be47";

        let fromPeer="f1";

        let expectedPeerIds = ["f3","f4","f5"];

        let upstreamPeerIds = session.getUpstreamPeerIds(peers,fromPeer,originStreamId);

        expect(upstreamPeerIds).to.include.members(expectedPeerIds);

      });
    });
    
    
});