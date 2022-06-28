import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const LoadingScreen = () => {
  return <p>Loading...</p>;
};

type InputSelectionData = {
  videoFile: FileList;
  transcriptionFile: FileList;
};

const downloadFile = (data: Uint8Array, fileName: string) => {
  const a = document.createElement("a");
  const url = URL.createObjectURL(
    new Blob([data.buffer], { type: "video/mp4" })
  );
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.parentNode?.removeChild(a);
  URL.revokeObjectURL(url);
};

const InputSelection = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<InputSelectionData>({
    mode: "onChange"
  });
  const onSubmit = useCallback(async (input: InputSelectionData) => {
    const videoFile = input.videoFile.item(0);
    const transcriptionFile = input.transcriptionFile.item(0);

    if (!videoFile || !transcriptionFile) return;

    ffmpeg.FS("writeFile", "input.mp4", await fetchFile(videoFile));
    ffmpeg.FS("writeFile", "input.vtt", await fetchFile(transcriptionFile));

    await ffmpeg.run(
      ..."-i input.mp4 -i input.vtt -c:s mov_text -c:v copy -c:a copy -metadata:s:s:0 language=eng output.mp4".split(
        " "
      )
    );
    const output = ffmpeg.FS("readFile", "output.mp4");
    downloadFile(output, `captioned-${videoFile.name}`);
  }, []);
  return (
    <>
      <form
        className="w-full max-w-lg m-auto py-10 mt-10 px-10 border"
        onSubmit={handleSubmit(onSubmit)}
      >
        <label htmlFor="videoFile" className="text-gray-600 font-medium">
          Video File
        </label>
        <input
          id="videoFile"
          aria-invalid={errors.videoFile ? "true" : "false"}
          type="file"
          accept="video/mp4"
          {...register("videoFile", { required: true })}
        />

        <label htmlFor="transcriptionFile">Transcription File</label>
        <input
          id="transcriptionFile"
          aria-invalid={errors.transcriptionFile ? "true" : "false"}
          type="file"
          accept="text/vtt"
          {...register("transcriptionFile", { required: true })}
        />

        <button type="submit" disabled={!isValid}>Merge</button>
      </form>
    </>
  );
};

const ffmpeg = createFFmpeg({ log: true });

function App() {
  const [loading, setLoading] = useState(true);

  const load = async () => {
    await ffmpeg.load();
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);
  return loading ? <LoadingScreen /> : <InputSelection />;
}

export default App;
