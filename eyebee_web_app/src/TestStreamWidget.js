import React, { useEffect, useState,createRef,useRef } from "react";


const TestStreamWidget = (props) => {    

    const canvasRef = createRef();
    const videoRef = createRef();
    const reqAnimation = useRef();



    useEffect(() => {
        if(videoRef.current && canvasRef.current){
            let textOnly = props.textOnly;
            let canvas = canvasRef.current;
            let context = canvasRef.current.getContext('2d', { alpha: false });
            let videoEl = videoRef.current;
           
            if(!videoEl.src && !props.textOnly){
                videoEl.src = props.source;
            }

            let counter = 0;
            const drawImage = () => {

                if(context){
                    if(textOnly){
                        context.clearRect(0,0,canvas.width,canvas.height);
                        context.font = "30px Comic Sans MS";
                        context.fillStyle = "red";
                        context.textAlign = "center";
                        context.fillText(props.text || "test "+counter, canvas.width/2, canvas.height/2);
                        counter++;
                    }else{
                        context.drawImage(videoEl, 0, 0, videoEl.width, videoEl.height);
                    }
                    
                    
                }else{
                    console.debug("useEffect 1 -- canvas.current is null");
                }
                
                reqAnimation.current = setTimeout(drawImage,1000);
                
            }

            if(!props.textOnly){
                videoRef.current.onplay = () => {
                    reqAnimation.current = setTimeout(drawImage,1000);
                   
                   props.onCanvasElement(canvas,videoRef.current);
                }
            }else{
                reqAnimation.current = setTimeout(drawImage,1000);
                   
                props.onCanvasElement(canvas,null);
            }
           
           
        }

        return () => {
            console.debug("cancelando el animation frame");
            clearTimeout(reqAnimation.current);
            //cancelAnimationFrame(reqAnimation.current);
        }
    },[props.textOnly,videoRef.current,canvasRef.current]);

    return (
        <div style={{
            position:"absolute",
            visibility:"hidden"
        }}>
            <video height="240" volume={0} muted={true} width="320" loop={true} playsInline={true} autoPlay={true} ref={videoRef} />
            <canvas height="240" width="320" ref={canvasRef}>

            </canvas>
        </div>
    );
};

export default TestStreamWidget;