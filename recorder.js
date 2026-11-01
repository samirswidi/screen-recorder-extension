// Professional Screen Recorder
let recorder = null;
let chunks = [];
let activeStream = null;
let micStream = null;
let systemStream = null;
let cameraStream = null;
let keepAliveInterval = null;
let audioCtx = null;
let compositeCanvas = null;
let compositeRaf = null;
let compositeVideos = [];

const recBtn = document.getElementById('rec');
const stopBtn = document.getElementById('stop');
const statusText = document.getElementById('statusText');
const statusDiv = document.getElementById('status');
const autoSaveToggle = document.getElementById('autoSaveToggle');

// Persist auto-save preference
if (autoSaveToggle) {
    try {
        chrome.storage.local.get(['autoSave'], (res) => {
            if (typeof res.autoSave === 'boolean') autoSaveToggle.checked = res.autoSave;
        });
    } catch (e) {}
    autoSaveToggle.addEventListener('change', () => {
        try { chrome.storage.local.set({ autoSave: autoSaveToggle.checked }); } catch (e) {}
    });
}

function getRecordType() {
    const el = document.querySelector('input[name="recordType"]:checked');
    return el ? el.value : 'screen';
}

function getAudioType() {
    const el = document.querySelector('input[name="audioType"]:checked');
    return el ? el.value : 'none';
}

function getExportFormat() {
    const el = document.querySelector('input[name="exportFormat"]:checked');
    return el ? el.value : 'webm';
}

// Update UI
function updateUI(recording, status) {
    recBtn.disabled = recording;
    stopBtn.disabled = !recording;
    statusText.textContent = status;

    statusDiv.classList.remove('status-idle', 'status-recording');
    if (recording) {
        statusDiv.classList.add('status-recording');
    } else {
        statusDiv.classList.add('status-idle');
    }
}

// Get supported MIME type
function getSupportedMimeType() {
    const format = getExportFormat();
    const mp4Types = [
        'video/mp4;codecs=avc1.4d002a,mp4a.40.2',
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4'
    ];
    const webmTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
    ];
    const types = format === 'mp4' ? mp4Types.concat(webmTypes) : webmTypes.concat(mp4Types);

    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            console.log('Using MIME type:', type);
            return type;
        }
    }
    return 'video/webm';
}

// Cleanup
function cleanup() {
    console.log('Cleaning up...');

    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }

    if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch (e) {}
    }

    [activeStream, micStream, systemStream, cameraStream].forEach((s) => {
        if (s) s.getTracks().forEach((t) => t.stop());
    });

    if (audioCtx) {
        try { audioCtx.close(); } catch (e) {}
        audioCtx = null;
    }

    if (compositeRaf) {
        cancelAnimationFrame(compositeRaf);
        compositeRaf = null;
    }
    compositeVideos.forEach((v) => { try { v.pause(); v.srcObject = null; } catch (e) {} });
    compositeVideos = [];
    compositeCanvas = null;

    recorder = null;
    chunks = [];
    activeStream = null;
    micStream = null;
    systemStream = null;
    cameraStream = null;
}

// Download function
function downloadRecording(blob, mimeType) {
    const extension = mimeType.includes('mp4') ? '.mp4' : '.webm';
    const filename = `recording-${Date.now()}${extension}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Download completed:', filename);
    }, 100);
}

// Composite screen + camera via canvas
async function compositeScreenCamera(screenStream, cameraStream) {
    const vScreen = document.createElement('video');
    vScreen.srcObject = screenStream;
    vScreen.muted = true;
    vScreen.playsInline = true;
    await vScreen.play().catch(() => {});
    const vCam = document.createElement('video');
    vCam.srcObject = cameraStream;
    vCam.muted = true;
    vCam.playsInline = true;
    await vCam.play().catch(() => {});

    compositeVideos = [vScreen, vCam];

    // wait for dimensions
    await new Promise((resolve) => {
        if (vScreen.readyState >= 2) resolve();
        else vScreen.onloadedmetadata = () => resolve();
    });

    const canvas = document.createElement('canvas');
    canvas.width = vScreen.videoWidth || 1280;
    canvas.height = vScreen.videoHeight || 720;
    compositeCanvas = canvas;
    const ctx = canvas.getContext('2d');

    function draw() {
        if (!vScreen.videoWidth) { compositeRaf = requestAnimationFrame(draw); return; }
        if (canvas.width !== vScreen.videoWidth || canvas.height !== vScreen.videoHeight) {
            canvas.width = vScreen.videoWidth;
            canvas.height = vScreen.videoHeight;
        }
        ctx.drawImage(vScreen, 0, 0, canvas.width, canvas.height);
        if (vCam.videoWidth) {
            const camW = Math.round(canvas.width * 0.22);
            const aspect = vCam.videoWidth / vCam.videoHeight || 4 / 3;
            const camH = Math.round(camW / aspect);
            const margin = 16;
            const x = canvas.width - camW - margin;
            const y = canvas.height - camH - margin;
            // rounded bg
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(x - 4, y - 4, camW + 8, camH + 8);
            ctx.drawImage(vCam, x, y, camW, camH);
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, camW, camH);
        }
        compositeRaf = requestAnimationFrame(draw);
    }
    draw();

    return canvas.captureStream(30);
}

// Build final stream based on options
async function buildStream() {
    const recordType = getRecordType();
    const audioType = getAudioType();
    const wantsSystem = audioType === 'system' || audioType === 'system+mic';
    const wantsMic = audioType === 'mic' || audioType === 'system+mic';

    let videoTracks = [];
    let audioTracks = [];

    if (recordType === 'camera') {
        const constraints = { video: true, audio: false };
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoTracks = cameraStream.getVideoTracks();
    } else if (recordType === 'tab') {
        // tab recording uses desktopCapture with tab source; picker will show tabs
        const streamId = await chooseDesktopMedia(['tab']);
        const constraints = {
            video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: streamId, maxWidth: 1920, maxHeight: 1080, maxFrameRate: 30 } },
            audio: false
        };
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoTracks = activeStream.getVideoTracks();
    } else if (recordType === 'screen+cam') {
        const sources = ['screen', 'window', 'tab'];
        const streamId = await chooseDesktopMedia(sources);
        const videoConstraints = {
            video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: streamId, maxWidth: 1920, maxHeight: 1080, maxFrameRate: 30 } },
            audio: wantsSystem ? { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: streamId } } : false
        };
        activeStream = await navigator.mediaDevices.getUserMedia(videoConstraints);
        if (wantsSystem) {
            systemStream = activeStream;
            audioTracks = audioTracks.concat(activeStream.getAudioTracks());
        }

        // camera stream
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const compositeStream = await compositeScreenCamera(activeStream, cameraStream);
        videoTracks = compositeStream.getVideoTracks();
    } else {
        const sources = ['screen', 'window', 'tab'];
        const streamId = await chooseDesktopMedia(sources);
        const videoConstraints = {
            video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: streamId, maxWidth: 1920, maxHeight: 1080, maxFrameRate: 30 } },
            audio: wantsSystem ? { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: streamId } } : false
        };
        activeStream = await navigator.mediaDevices.getUserMedia(videoConstraints);
        videoTracks = activeStream.getVideoTracks();
        if (wantsSystem) {
            systemStream = activeStream;
            audioTracks = audioTracks.concat(activeStream.getAudioTracks());
        }
    }

    if (wantsMic) {
        try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const micTracks = micStream.getAudioTracks();
            if (micTracks.length > 0) {
                audioCtx = new AudioContext();
                const dest = audioCtx.createMediaStreamDestination();
                const micSource = audioCtx.createMediaStreamSource(micStream);
                micSource.connect(dest);
                audioTracks = audioTracks.concat(dest.stream.getAudioTracks());
            }
        } catch (e) {
            console.log('Microphone denied:', e.message);
            micStream = null;
        }
    }

    const finalStream = new MediaStream([...videoTracks, ...audioTracks]);
    return finalStream;
}

function chooseDesktopMedia(sources) {
    return new Promise((resolve, reject) => {
        chrome.desktopCapture.chooseDesktopMedia(sources, (id) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (!id) {
                reject(new Error('User cancelled'));
            } else {
                resolve(id);
            }
        });
    });
}

// Start recording
recBtn.onclick = async () => {
    console.log('=== START RECORDING ===');
    updateUI(false, 'Initialisation...');
    try {
        cleanup();
        const finalStream = await buildStream();

        const mimeType = getSupportedMimeType();
        chunks = [];
        recorder = new MediaRecorder(finalStream, {
            mimeType,
            videoBitsPerSecond: 4_000_000,
            audioBitsPerSecond: 128_000
        });

        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        recorder.onstop = () => {
            console.log('=== RECORDER STOPPED ===');
            if (activeStream) activeStream.getTracks().forEach((t) => t.stop());
            if (micStream) micStream.getTracks().forEach((t) => t.stop());
            if (systemStream && systemStream !== activeStream) systemStream.getTracks().forEach((t) => t.stop());
            if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());

            if (chunks.length === 0) {
                updateUI(false, 'Erreur: aucune donnée');
                return;
            }
            const blob = new Blob(chunks, { type: mimeType });
            if (blob.size === 0) {
                updateUI(false, 'Erreur: fichier vide');
                return;
            }
            downloadRecording(blob, mimeType);
            updateUI(false, '✅ Enregistré !');
            setTimeout(() => updateUI(false, 'Prêt à enregistrer'), 3000);

            chrome.runtime.sendMessage({ type: 'recorder-status', isRecording: false });
            if (keepAliveInterval) { clearInterval(keepAliveInterval); keepAliveInterval = null; }

            chrome.windows.getCurrent((window) => {
                chrome.windows.update(window.id, { state: 'normal', focused: true });
            });
        };

        recorder.onerror = (e) => {
            console.error('Recorder error:', e);
            updateUI(false, 'Erreur');
            cleanup();
        };

        // Minimize window
        chrome.windows.getCurrent((window) => {
            chrome.windows.update(window.id, { state: 'minimized' });
        });

        setTimeout(() => {
            recorder.start(1000);
            chrome.runtime.sendMessage({ type: 'recorder-status', isRecording: true });
            keepAliveInterval = setInterval(() => {}, 5000);
            updateUI(true, '🔴 Enregistrement...');
        }, 800);
    } catch (error) {
        console.error('Error:', error);
        updateUI(false, 'Échec');
        cleanup();
        if (!error.message.includes('cancel')) {
            alert('Échec du démarrage: ' + error.message);
        }
    }
};

// Stop recording
stopBtn.onclick = () => {
    updateUI(false, 'Arrêt...');
    chrome.windows.getCurrent((window) => {
        chrome.windows.update(window.id, { state: 'normal', focused: true });
    });
    if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
    } else {
        updateUI(false, 'Prêt à enregistrer');
    }
};

// Initialize
console.log('Recorder loaded');
updateUI(false, 'Prêt à enregistrer');

window.addEventListener('beforeunload', cleanup);

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'command-stop') {
        if (recorder && recorder.state !== 'inactive') stopBtn.click();
    }
});

window.addEventListener('focus', () => {
    if (recorder && recorder.state === 'recording') {
        const autoSaveEnabled = autoSaveToggle ? autoSaveToggle.checked : true;
        if (autoSaveEnabled) {
            stopBtn.click();
        } else {
            chrome.windows.getCurrent((window) => {
                chrome.windows.update(window.id, { state: 'normal', focused: true });
            });
        }
    }
});