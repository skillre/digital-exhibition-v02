// src/video-player.js — VideoTexture 视频播放管理
// 在 3D 屏幕上播放视频，支持点击播放/暂停

/**
 * 创建视频播放器
 * @param {BABYLON.Scene} scene
 * @param {BABYLON.Mesh} screenMesh - 视频屏幕 Mesh
 * @param {string} videoSrc - 视频文件路径
 * @param {string} posterSrc - 视频封面图路径（可选）
 * @returns {{ togglePlayback, isPlaying, dispose }}
 */
export function createVideoPlayer(scene, screenMesh, videoSrc, posterSrc) {
  let videoTexture = null;
  let isPlaying = false;
  let isLoaded = false;

  // 初始材质（深色 + 微弱蓝光）
  const idleMat = new BABYLON.StandardMaterial('video-idle-mat-' + screenMesh.name, scene);
  idleMat.diffuseColor = new BABYLON.Color3(0.12, 0.15, 0.25);
  idleMat.emissiveColor = new BABYLON.Color3(0.08, 0.10, 0.20);
  screenMesh.material = idleMat;

  // 尝试加载封面图
  if (posterSrc) {
    console.log(`[视频封面] 加载中: ${posterSrc}`);
    const posterTex = new BABYLON.Texture(posterSrc, scene, false, true, undefined, () => {
      idleMat.diffuseTexture = posterTex;
      idleMat.emissiveColor = new BABYLON.Color3(0.10, 0.10, 0.15);
      console.log(`[视频封面] 加载成功`);
    }, (_, err) => {
      console.error(`[视频封面] 加载失败`, err);
    });
  }

  /**
   * 初始化 VideoTexture（首次播放时调用）
   */
  async function initVideoTexture() {
    if (isLoaded) return;

    try {
      console.log(`[视频] 初始化: ${videoSrc}`);
      videoTexture = new BABYLON.VideoTexture(
        'video-tex-' + screenMesh.name,
        videoSrc,
        scene,
        true,   // generateMipMaps
        true,   // invertY
        undefined,
        { autoPlay: false, autoUpdateTexture: true }
      );
      console.log(`[视频] 初始化成功`);

      const mat = new BABYLON.StandardMaterial('video-playing-mat-' + screenMesh.name, scene);
      mat.diffuseTexture = videoTexture;
      mat.emissiveColor = new BABYLON.Color3(0.25, 0.25, 0.30); // 自发光让屏幕更亮
      mat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.08);
      screenMesh.material = mat;

      isLoaded = true;

      // 视频结束事件
      videoTexture.video.addEventListener('ended', () => {
        isPlaying = false;
        // 可选择循环播放
        videoTexture.video.currentTime = 0;
        videoTexture.video.play();
        isPlaying = true;
      });
    } catch (e) {
      console.error('VideoTexture 初始化失败:', e);
    }
  }

  /**
   * 切换播放/暂停
   */
  async function togglePlayback() {
    if (!isLoaded) {
      await initVideoTexture();
    }

    if (!videoTexture) return;

    if (isPlaying) {
      videoTexture.video.pause();
      isPlaying = false;
    } else {
      try {
        await videoTexture.video.play();
        isPlaying = true;
      } catch (e) {
        console.warn('视频播放失败（可能需要用户交互）:', e.message);
      }
    }
  }

  /**
   * 销毁资源
   */
  function dispose() {
    if (videoTexture) {
      videoTexture.video.pause();
      videoTexture.video.src = '';
      videoTexture.dispose();
      videoTexture = null;
    }
  }

  return { togglePlayback, isPlaying: () => isPlaying, dispose };
}
