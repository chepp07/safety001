import { IMGBB_KEY } from "../config.js";
import { state } from "../state.js";

export async function uploadPhotoDirectly(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1];
      const fd = new FormData();
      fd.append("key", IMGBB_KEY);
      fd.append("image", base64);
      try {
        const res = await fetch("https://api.imgbb.com/1/upload", { method:"POST", body:fd });
        const json = await res.json();
        if(json.success) resolve(json.data.url);
        else resolve(null);
      } catch(err) {
        resolve(null);
      }
    };
    reader.readAsDataURL(file);
  });
}

export function removePhoto(idx) {
  const { form } = state;
  form.photos.splice(idx, 1);
  form.photosPreviews.splice(idx, 1);
}
