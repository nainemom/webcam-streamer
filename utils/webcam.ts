const { spawn } = Bun;

type DataListener = (image: Buffer) => void

const ffmpegSpawn = (device: string) => spawn([
  'ffmpeg',
  '-i', device, // input
  // '-vcodec', 'mjpeg', // webm libx264 copy libwebp mjpeg
  '-an', // disable audio
  '-r', '15', // frame rate
  // '-acodec', 'copy',
  '-preset', 'veryslow',
  '-f', 'image2pipe', // image2pipe hls webm png_pipe mjpeg
  '-hide_banner', '-loglevel', 'quiet',
  'pipe:1'
]);


export const streamWebcam = (device: string) => {
  let ffmpegProcess: ReturnType<typeof ffmpegSpawn>;
  let listeners: DataListener[] = [];

  const onData = (listener: DataListener) => {
    listeners = [
      ...listeners,
      listener,
    ];
  };

  const offData = (listener: DataListener) => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners = [
        ...listeners.slice(0, index),
        ...listeners.slice(index + 1),
      ]
    }
  }

  
  const start = async () => {
    ffmpegProcess = ffmpegSpawn(device);


    let chunks: Buffer[] = [];

    let timeout: Timer | null = null;

    for await (const chunk of ffmpegProcess.stdout) {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        listeners.forEach((listener) => listener(Buffer.concat(chunks)));
        chunks = [];
      }, 0);
      chunks = [
        ...chunks,
        Buffer.from(chunk),
      ];
    }
  }

  start();

  // const stop = () => {
  //   if (ffmpegProcess && !ffmpegProcess.killed) {
  //     ffmpegProcess.kill(2)
  //   }
  // }
  

  return {
    onData,
    offData,
  };
  
}