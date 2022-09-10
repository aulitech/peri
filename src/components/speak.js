export let speakTimer;

export function speak(txt, tmr) {
    var msg = new SpeechSynthesisUtterance();
    msg.text = txt;
    clearTimeout(speakTimer);
    speakTimer = setTimeout(
        (msg) => {
            window.speechSynthesis.speak(msg);
        },
        tmr,
        msg
    );
}