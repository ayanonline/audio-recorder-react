import { useEffect, useState } from "react";

const useMediaRecorder = () => {
  const [isNotAllow, setIsNotAllow] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<number | undefined>(
    undefined
  );
  const [recordingBlob, setRecordingBlob] = useState<Blob>();
  const [selectedAudioDevice, setSelectedAudioDevice] =
    useState<string>("default");
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[] | null>(
    null
  );
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();
  const [audioPermission, setAudioPermission] = useState<boolean>();

  /**If has microphone access then get all audio devices and cache selected audio-device */
  useEffect(() => {
    if (localStorage.getItem("audioPermission") === "YES") {
      setAudioPermission(true);
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const audioInputs = devices.filter(
            (device) => device.kind === "audioinput"
          );
          setAudioDevices(audioInputs);
          if (
            localStorage.getItem("deviceId") &&
            audioInputs.find(
              (device) => device.deviceId === localStorage.getItem("deviceId")
            )
          ) {
            setSelectedAudioDevice(localStorage.getItem("deviceId")!);
          } else {
            setSelectedAudioDevice(audioInputs[0]?.deviceId || "default");
          }
        })
        .catch(() => {
          localStorage.setItem("audioPermission", "NO");
          setAudioPermission(false);
        });
    }
  }, [audioPermission]);

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

      setIsNotAllow(false);
      localStorage.setItem("audioPermission", "YES");

      setAudioPermission(true);

      // CREATE MEDIA_RECORDER
      const recorder = new MediaRecorder(audioStream);
      setRecordingTime(0);
      setIsPaused(false);
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
    } catch (err: unknown) {
      const error = err as DOMException;
      if (error.message === "Permission denied") {
        localStorage.setItem("audioPermission", "NO");
        setIsNotAllow(true);
        setAudioPermission(false);
      }
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

  const pauseRecording = () => {
    setIsPaused(true);
    stopTimer();
    mediaRecorder?.pause();
  };

  const changeAudioDevice = (deviceId: string) => {
    setSelectedAudioDevice(deviceId);
    localStorage.setItem("deviceId", deviceId);
  };

  return {
    isNotAllow,
    isPaused,
    isRecording,
    recordingBlob,
    recordingTime,
    setRecordingTime,
    mediaRecorder,
    selectedAudioDevice,
    audioDevices,
    changeAudioDevice,
    startRecording,
    stopRecording,
    togglePauseResume,
    pauseRecording,
  };
};

export default useMediaRecorder;
