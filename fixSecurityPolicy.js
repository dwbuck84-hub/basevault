const fs = require('fs');

try {
    const cspHeader = `
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * 'unsafe-inline'; img-src * data: blob:; frame-src *; style-src * 'unsafe-inline';"
          }
        ]
      }
    ];
  }`;

    const files = ['next.config.ts', 'next.config.mjs', 'next.config.js'];
    let targetFile = files.find(f => fs.existsSync(f));

    if (!targetFile) {
        console.log("⚠️ No config found. Generating a fresh next.config.mjs...");
        const newConfig = `/** @type {import('next').NextConfig} */\nconst nextConfig = {${cspHeader}\n};\nexport default nextConfig;`;
        fs.writeFileSync('next.config.mjs', newConfig, 'utf8');
        console.log("✅ SECURITY FIREWALL BYPASSED: Created next.config.mjs with Web3 CSP.");
        process.exit(0);
    }

    let code = fs.readFileSync(targetFile, 'utf8');

    if (code.includes('async headers()')) {
        console.log(`⚠️ Headers already exist in ${targetFile}. Please manually add unsafe-eval.`);
        process.exit(0);
    }

    if (code.includes('const nextConfig: NextConfig = {')) {
        code = code.replace(/(const nextConfig: NextConfig\s*=\s*\{)/, `$1\n${cspHeader},`);
    } else if (code.includes('const nextConfig = {')) {
        code = code.replace(/(const nextConfig\s*=\s*\{)/, `$1\n${cspHeader},`);
    } else if (code.includes('export default {')) {
        code = code.replace(/(export default\s*\{)/, `$1\n${cspHeader},`);
    } else if (code.includes('module.exports = {')) {
        code = code.replace(/(module\.exports\s*=\s*\{)/, `$1\n${cspHeader},`);
    } else {
        console.log(`⚠️ Unrecognized format in ${targetFile}. Generating fallback vercel.json...`);
        const vercelJson = { headers: [{ source: "/(.*)", headers: [{ key: "Content-Security-Policy", value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * 'unsafe-inline'; img-src * data: blob:; frame-src *; style-src * 'unsafe-inline';" }] }] };
        fs.writeFileSync('vercel.json', JSON.stringify(vercelJson, null, 2), 'utf8');
        console.log("✅ SECURITY FIREWALL BYPASSED: Injected via vercel.json fallback.");
        process.exit(0);
    }
    
    fs.writeFileSync(targetFile, code, 'utf8');
    console.log(`✅ SECURITY FIREWALL BYPASSED: Web3 CSP injected into ${targetFile}.`);
    
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
