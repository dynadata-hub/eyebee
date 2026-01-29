class MobileDeviceDetector {
    constructor(){

    }

    isIOS() {
      if (/iPad|iPhone|iPod/.test(navigator.platform)) {
        return true;
      } else {
        return navigator.maxTouchPoints &&
          navigator.maxTouchPoints > 2 &&
          /MacIntel/.test(navigator.platform);
      }
    }

    isIpadOS() {
      return navigator.maxTouchPoints &&
        navigator.maxTouchPoints > 2 &&
        /MacIntel/.test(navigator.platform);
    }

    isMobile(){
        if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Mobile|Opera Mini/i.test(navigator.userAgent)
          || this.isIOS()
          || this.isIpadOS()
        ){
            // true for mobile device
            return true;
           
          }else{
            // false for not mobile device
            return false;
           
          }
        return false;
    }
}

export default MobileDeviceDetector;