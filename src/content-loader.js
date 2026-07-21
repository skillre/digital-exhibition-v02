// src/content-loader.js — 内容加载器
// 从 contents.json 加载展区和展品数据

/**
 * 加载 contents.json 配置文件
 * @returns {{ meta, zones: Array, getZone(id) }}
 */
export async function loadContent() {
  const resp = await fetch('contents.json');
  if (!resp.ok) {
    throw new Error(`Failed to load contents.json: ${resp.status}`);
  }
  const data = await resp.json();

  function getZone(id) {
    return data.zones.find(z => z.id === id);
  }

  function getPosterZones() {
    return data.zones.filter(z => z.type === 'poster');
  }

  function getVideoZones() {
    return data.zones.filter(z => z.type === 'video');
  }

  function getDocZones() {
    return data.zones.filter(z => z.type === 'document');
  }

  return {
    meta: data.meta,
    zones: data.zones,
    getZone,
    getPosterZones,
    getVideoZones,
    getDocZones,
  };
}

/**
 * 加载纹理图片
 * @param {string} url - 图片路径
 * @param {BABYLON.Scene} scene
 * @returns {Promise<BABYLON.Texture>}
 */
export function loadTexture(url, scene) {
  return new Promise((resolve, reject) => {
    const tex = new BABYLON.Texture(
      url,
      scene,
      true,                    // generateMipMaps
      false,                   // invertY
      undefined,               // samplingMode
      () => resolve(tex),      // onLoad
      (_, err) => reject(new Error(`纹理加载失败: ${url} - ${err}`))
    );
  });
}

/**
 * 创建 VideoTexture（需要用户交互后才能播放）
 * @param {string} url - 视频路径
 * @param {BABYLON.Scene} scene
 * @returns {Promise<BABYLON.VideoTexture>}
 */
export function createVideoTexture(url, scene) {
  return new Promise((resolve, reject) => {
    try {
      const vt = new BABYLON.VideoTexture(
        'video-' + Date.now(),
        url,
        scene,
        true,   // generateMipMaps
        false,  // invertY
        undefined, // samplingMode
        {},     // settings
        () => resolve(vt),
        (_, err) => reject(new Error(`视频加载失败: ${url} - ${err}`))
      );
    } catch (e) {
      reject(e);
    }
  });
}
