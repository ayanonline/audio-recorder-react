import { ChangeEvent, useEffect, useState } from "react";
import { formatTime } from "./utils";

const App = () => {
  const [isNotAllow, setIsNotAllow] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isRecodring, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<number>();
  const [recordingBlob, setRecordingBlob] = useState<Blob>();
  const [selectedAudioDevice, setSelectedAudioDevice] =
    useState<string>("default");
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[] | null>(
    null
  );
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();
  const [microphoneAccess, setMicrophoneAccess] = useState<boolean>(false);

  useEffect(() => {
    return () => stopTimer();
  }, []);

  // PROCESS RECORDING BLOB
  useEffect(() => {
    if (recordingBlob) {
      console.log("***blob created***");
      console.log(recordingBlob);
    }
  }, [recordingBlob]);

  /**If has microphone access then get all audio devices */
  useEffect(() => {
    if (localStorage.getItem("audioPermission") === "YES") {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const audioInputs = devices.filter(
            (device) => device.kind === "audioinput"
          );
          setAudioDevices(audioInputs);
          setSelectedAudioDevice(audioInputs[0]?.deviceId || "default");
        })
        .catch(() => {
          localStorage.setItem("audioPermission", "NO");
        });
    }
  }, [microphoneAccess]);

  // START TIMER
  const startTimer = () => {
    const interval = setInterval(() => {
      setRecordingTime((time) => time + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  // STOP TIMER
  const stopTimer = () => {
    timerInterval != null && clearInterval(timerInterval);
    setTimerInterval(undefined);
  };

  // START RECORDING
  const startRecording = async () => {
    try {
      // IF MIC FOUND
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedAudioDevice,
          noiseSuppression: true,
          echoCancellation: true,
        },
      });
      playAudio(audioStream);

      setIsNotAllow(false);
      localStorage.setItem("audioPermission", "YES");

      setMicrophoneAccess(true);

      // CREATE MEDIA_RECORDER
      const recorder = new MediaRecorder(audioStream);

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      startTimer();

      // SET RECORDING BLOB WHEN DATA AVAILABLE
      recorder.ondataavailable = (event) => {
        setRecordingBlob(event.data);
        recorder.stream.getTracks().forEach((t) => t.stop());
        setMediaRecorder(undefined);
      };
    } catch (error: unknown) {
      // WE CAN HANDLE MIC PERMISSION RELATED ERROR HERE ALSO
      localStorage.setItem("audioPermission", "NO");
      setIsNotAllow(true);
      setMicrophoneAccess(false);
      console.log(error);
    }
  };

  // STOP RECORDING
  const stopRecording = () => {
    mediaRecorder?.stop();
    stopTimer();
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
  };

  // TOGGLE PAUSE RESUME
  const togglePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      mediaRecorder?.resume();
      startTimer();
    } else {
      setIsPaused(true);
      stopTimer();
      mediaRecorder?.pause();
    }
  };

  const handleChangeMic = (e: ChangeEvent<HTMLSelectElement>) => {
    console.log(e.target.value);
    setSelectedAudioDevice(e.target.value);
  };

  // Play audio
  function playAudio(stream: MediaStream) {
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play();
  }

  return (
    <div>
      <h1>Recording POC</h1>
      <h3>{formatTime(recordingTime)}</h3>
      {isNotAllow && <h3>Mic is disabled, give mic access to record</h3>}

      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>

      <button onClick={togglePauseResume}>
        {isPaused ? "Resume" : "Pause"} Recording
      </button>

      <select name="" id="" onChange={handleChangeMic} disabled={isRecodring}>
        {audioDevices?.map((device) => (
          <option value={device.deviceId} key={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default App;
