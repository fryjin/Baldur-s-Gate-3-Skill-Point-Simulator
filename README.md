# 重要修正

Windows 请在**完整解压后的项目根目录**双击 `download_images_windows.bat`。该启动脚本会自动定位同目录下的 `scripts/download_images.py`。不要只复制 BAT 文件，也不要直接在压缩包预览窗口中运行。

# BG3 加点模拟器 GitHub Pages 部署包

## 目录
- `index.html`：部署入口
- `assets/spells/`：法术和戏法图片
- `assets/skills/`：后续技能图片
- `assets/feats/`：后续专长图片
- `assets/classes/`：后续职业和子职业图片
- `data/vgbaike_remote_manifest.json`：VG百科图片源清单
- `data/local_image_manifest.json`：HTML 本地相对路径清单
- `scripts/download_images.py`：图片下载脚本

## 下载图片
Windows 双击：
`download_images_windows.bat`

macOS / Linux：
```bash
chmod +x download_images_mac_linux.sh
./download_images_mac_linux.sh
```

也可以直接执行：
```bash
python scripts/download_images.py
```

下载成功后，图片会保存到 `assets/spells/`。

## GitHub Pages 部署
1. 将整个文件夹内容上传至仓库根目录。
2. 仓库 Settings → Pages。
3. Source 选择 `Deploy from a branch`。
4. Branch 选择 `main`，目录选择 `/ (root)`。
5. 保存后等待 Pages 地址生成。

## 注意
图片来源清单来自 VG百科。正式公开部署前请确认图片授权与使用范围。HTML 使用相对路径，部署后不再依赖 VG百科图片服务器。


## Windows SSL certificate error

If `media.vgbaike.com` reports `CERTIFICATE_VERIFY_FAILED` or
`certificate has expired`, use the included updated downloader.

The script first performs normal HTTPS verification. Only when the exact
allowlisted host `media.vgbaike.com` fails because of its expired certificate
does it retry without certificate verification. It then validates that the
response bytes are a PNG, JPEG, WEBP, or GIF image.

Run:

```bat
download_images_windows.cmd
```

Successful downloads are written to:

```text
assets\spells\
```

A successful complete run ends with:

```text
Finished: 56 succeeded, 0 failed
```
