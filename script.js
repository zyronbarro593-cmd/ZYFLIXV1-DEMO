// =========================================================
// ZYFLIX — THE ORIGINS OF ZYFLIXV1 (Homepage Embed Demo)
// Soundtrack Toggle ("K." by Cigarettes After Sex)
// Smooth Volume Fade-In, Fade-Out & Seamless Crossfade Loop
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  const track = {
    title: "K.",
    artist: "CIGARETTES AFTER SEX",
    src: "assets/k-cigarettes-after-sex.mp3"
  };

  const toggleBtn = document.getElementById("soundtrackToggle");
  const playTriggerBtn = document.getElementById("playTriggerBtn");
  const toggleText = document.getElementById("musicToggleText");
  const audioA = document.getElementById("bgMusicA");
  const audioB = document.getElementById("bgMusicB");

  if (!toggleBtn || !audioA || !audioB) return;

  let isPlaying = false;
  let isCrossfading = false;
  let activeAudio = audioA;
  let standbyAudio = audioB;
  let fadeTimer = null;

  const FADE_DURATION_MS = 2200; // 2.2-second smooth crossfade on continuous loop
  const AUTO_CROSSFADE_LEAD_SEC = 3.2; // Start seamless crossfade 3.2s before song ends

  const updateToggleUI = (playing) => {
    toggleBtn.classList.toggle("is-on", playing);
    toggleBtn.setAttribute("aria-pressed", playing ? "true" : "false");
    if (toggleText) toggleText.textContent = playing ? "ON" : "OFF";
  };

  const clearFadeTimer = () => {
    if (fadeTimer) {
      clearInterval(fadeTimer);
      fadeTimer = null;
    }
  };

  const rampVolume = (audioEl, fromVol, toVol, durationMs, onComplete) => {
    clearFadeTimer();
    const steps = 24;
    const stepTime = Math.max(20, Math.floor(durationMs / steps));
    let currentStep = 0;
    audioEl.volume = Math.max(0, Math.min(1, fromVol));

    fadeTimer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const nextVol = fromVol + (toVol - fromVol) * progress;
      audioEl.volume = Math.max(0, Math.min(1, nextVol));

      if (currentStep >= steps) {
        clearFadeTimer();
        audioEl.volume = Math.max(0, Math.min(1, toVol));
        if (onComplete) onComplete();
      }
    }, stepTime);
  };

  const crossfadeLoop = () => {
    if (!isPlaying || isCrossfading) return;
    isCrossfading = true;
    clearFadeTimer();

    const outgoing = activeAudio;
    const incoming = standbyAudio;

    incoming.src = track.src;
    incoming.currentTime = 0;
    incoming.volume = 0;

    const startOutVol = outgoing.paused ? 0 : (outgoing.volume || 1);

    incoming
      .play()
      .then(() => {
        const steps = 28;
        const stepTime = Math.max(25, Math.floor(FADE_DURATION_MS / steps));
        let step = 0;

        fadeTimer = setInterval(() => {
          step++;
          const progress = step / steps;
          incoming.volume = Math.max(0, Math.min(1, progress));
          if (!outgoing.paused) {
            outgoing.volume = Math.max(0, Math.min(1, startOutVol * (1 - progress)));
          }

          if (step >= steps) {
            clearFadeTimer();
            outgoing.pause();
            outgoing.currentTime = 0;
            incoming.volume = 1;
            activeAudio = incoming;
            standbyAudio = outgoing;
            isCrossfading = false;
          }
        }, stepTime);
      })
      .catch(() => {
        // Fallback: replay cleanly on activeAudio if standby was not unlocked
        clearFadeTimer();
        outgoing.currentTime = 0;
        outgoing.volume = 0;
        outgoing
          .play()
          .then(() => {
            rampVolume(outgoing, 0, 1, 1000, () => {
              isCrossfading = false;
            });
          })
          .catch(() => {
            isCrossfading = false;
          });
      });
  };

  const handleTogglePlayback = () => {
    if (standbyAudio.paused && !standbyAudio.getAttribute("src")) {
      standbyAudio.volume = 0;
    }

    if (!isPlaying) {
      isPlaying = true;
      isCrossfading = false;
      if (!activeAudio.getAttribute("src")) {
        activeAudio.src = track.src;
      }
      activeAudio.volume = 0;
      activeAudio
        .play()
        .then(() => {
          updateToggleUI(true);
          rampVolume(activeAudio, 0, 1, 900);
        })
        .catch((err) => {
          console.warn("Audio playback blocked:", err);
          isPlaying = false;
          updateToggleUI(false);
        });
    } else {
      isPlaying = false;
      isCrossfading = false;
      updateToggleUI(false);
      standbyAudio.pause();
      const startVol = activeAudio.volume || 1;
      rampVolume(activeAudio, startVol, 0, 650, () => {
        activeAudio.pause();
      });
    }
  };

  const handleTimeUpdate = (e) => {
    const el = e.target;
    if (el !== activeAudio || !isPlaying || isCrossfading) return;
    if (
      el.duration &&
      isFinite(el.duration) &&
      el.duration > 10 &&
      el.duration - el.currentTime <= AUTO_CROSSFADE_LEAD_SEC
    ) {
      crossfadeLoop();
    }
  };

  const handleTrackEnded = (e) => {
    const el = e.target;
    if (el !== activeAudio || !isPlaying || isCrossfading) return;
    crossfadeLoop();
  };

  [audioA, audioB].forEach((aud) => {
    aud.addEventListener("timeupdate", handleTimeUpdate);
    aud.addEventListener("ended", handleTrackEnded);
  });

  toggleBtn.addEventListener("click", handleTogglePlayback);
  if (playTriggerBtn) {
    playTriggerBtn.addEventListener("click", handleTogglePlayback);
  }
});
