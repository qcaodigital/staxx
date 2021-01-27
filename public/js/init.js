function setOrientation(){
    if(window.innerWidth > window.innerHeight){
        $('.game_window').addClass('landscape');
        $('.game_window').removeClass('portrait');
    } else {
        $('.game_window').addClass('portrait');
        $('.game_window').removeClass('landscape');
    }
}

setOrientation();
$(window).resize(() => {
    setOrientation();
})

