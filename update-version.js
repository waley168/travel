#!/usr/bin/env node

/**
 * 自動版本控制腳本
 * 在 HTML 文件中的 CSS 和 JS 引用後添加版本號查詢參數
 * 使用當前時間戳作為版本號,避免瀏覽器快取
 */

const fs = require('fs');
const path = require('path');

// 生成版本號 (使用時間戳)
const version = Date.now();

console.log(`🔄 更新版本號: ${version}`);

// 遞迴搜尋所有 HTML 文件
function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // 排除 node_modules, .git 等目錄
            if (!['node_modules', '.git', '.vscode'].includes(file)) {
                findHtmlFiles(filePath, fileList);
            }
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// 更新 HTML 文件中的版本號
function updateVersionInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // 匹配 CSS 引用: <link rel="stylesheet" href="...">
    const cssRegex = /<link\s+rel="stylesheet"\s+href="([^"]+\.css)(\?v=\d+)?"/g;
    content = content.replace(cssRegex, (match, url) => {
        updated = true;
        return `<link rel="stylesheet" href="${url}?v=${version}"`;
    });
    
    // 匹配 JS 引用: <script src="...">
    const jsRegex = /<script\s+src="([^"]+\.js)(\?v=\d+)?"/g;
    content = content.replace(jsRegex, (match, url) => {
        // 排除外部 CDN 連結
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return match;
        }
        updated = true;
        return `<script src="${url}?v=${version}"`;
    });
    
    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ 已更新: ${path.relative(process.cwd(), filePath)}`);
        return true;
    }
    
    return false;
}

// 更新 Service Worker 的快取版本號
function updateServiceWorkerVersion(dir) {
    const files = fs.readdirSync(dir);
    let swUpdated = false;
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !['node_modules', '.git', '.vscode'].includes(file)) {
            const swPath = path.join(filePath, 'service-worker.js');
            if (fs.existsSync(swPath)) {
                let content = fs.readFileSync(swPath, 'utf8');
                
                // 更新 CACHE_NAME 版本號
                const cacheRegex = /const CACHE_NAME = ['"]([^'"]+)-v(\d+)['"]/;
                const match = content.match(cacheRegex);
                
                if (match) {
                    const cacheName = match[1];
                    const oldVersion = parseInt(match[2], 10);
                    const newVersion = oldVersion + 1;
                    
                    content = content.replace(
                        cacheRegex,
                        `const CACHE_NAME = '${cacheName}-v${newVersion}'`
                    );
                    
                    fs.writeFileSync(swPath, content, 'utf8');
                    console.log(`✅ 已更新 Service Worker: ${path.relative(process.cwd(), swPath)} (v${oldVersion} → v${newVersion})`);
                    swUpdated = true;
                }
            }
            // 遞迴處理子目錄
            updateServiceWorkerVersion(filePath);
        }
    });
    
    return swUpdated;
}

// 主函數
function main() {
    const rootDir = process.cwd();
    console.log(`📁 搜尋目錄: ${rootDir}\n`);
    
    // 更新 HTML 文件
    const htmlFiles = findHtmlFiles(rootDir);
    
    if (htmlFiles.length === 0) {
        console.log('❌ 未找到 HTML 文件');
    } else {
        console.log(`📝 找到 ${htmlFiles.length} 個 HTML 文件\n`);
        
        let updatedCount = 0;
        htmlFiles.forEach(file => {
            if (updateVersionInFile(file)) {
                updatedCount++;
            }
        });
        
        console.log(`\n✅ HTML 文件更新完成! 共更新 ${updatedCount} 個文件`);
    }
    
    // 更新 Service Worker
    console.log(`\n🔧 更新 Service Worker 版本...\n`);
    updateServiceWorkerVersion(rootDir);
    
    console.log(`\n✨ 全部完成!`);
}

// 執行
main();
