#!/bin/bash

# 批量轉換圖片為 JPG 格式
cd "$(dirname "$0")/images"

echo "🔄 開始轉換圖片..."
echo ""

# 轉換 PNG 檔案
for file in *.png; do
    if [ -f "$file" ]; then
        filename="${file%.*}"
        echo "📸 轉換: $file -> ${filename}.jpg"
        sips -s format jpeg "$file" --out "${filename}.jpg" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            rm "$file"
            echo "   ✅ 完成並刪除原檔"
        else
            echo "   ❌ 轉換失敗"
        fi
    fi
done

# 轉換 WEBP 檔案
for file in *.webp; do
    if [ -f "$file" ]; then
        filename="${file%.*}"
        echo "📸 轉換: $file -> ${filename}.jpg"
        sips -s format jpeg "$file" --out "${filename}.jpg" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            rm "$file"
            echo "   ✅ 完成並刪除原檔"
        else
            echo "   ❌ 轉換失敗"
        fi
    fi
done

# 轉換 JPEG 檔案 (統一副檔名為 .jpg)
for file in *.jpeg; do
    if [ -f "$file" ]; then
        filename="${file%.*}"
        echo "📸 重新命名: $file -> ${filename}.jpg"
        mv "$file" "${filename}.jpg"
        echo "   ✅ 完成"
    fi
done

echo ""
echo "✨ 全部轉換完成！"
echo "📋 目前的檔案列表："
ls -1 *.jpg 2>/dev/null
