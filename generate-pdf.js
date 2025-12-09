// generate-pdf.js - Generate Project Overview PDF
const fs = require('fs');
const { execSync } = require('child_process');

console.log('📄 Generating Project Overview PDF...\n');

console.log('To generate PDF from the HTML file:');
console.log('Option 1: Open PROJECT_OVERVIEW.html in your browser and use Print > Save as PDF');
console.log('Option 2: Use the command below if you have Chrome/Chromium installed:\n');

const command = `google-chrome --headless --disable-gpu --print-to-pdf=PROJECT_OVERVIEW.pdf PROJECT_OVERVIEW.html`;
const commandAlt = `chromium --headless --disable-gpu --print-to-pdf=PROJECT_OVERVIEW.pdf PROJECT_OVERVIEW.html`;

console.log('   ', command);
console.log('   or');
console.log('   ', commandAlt);

console.log('\n✅ HTML file created at: PROJECT_OVERVIEW.html');
console.log('📂 Open this file in any browser to view or print as PDF\n');

// Try to automatically generate PDF if Chrome is available
try {
    console.log('🔄 Attempting to auto-generate PDF...');
    try {
        execSync(command, { stdio: 'inherit' });
        console.log('✅ PDF generated successfully: PROJECT_OVERVIEW.pdf');
    } catch (e) {
        try {
            execSync(commandAlt, { stdio: 'inherit' });
            console.log('✅ PDF generated successfully: PROJECT_OVERVIEW.pdf');
        } catch (e2) {
            console.log('ℹ️  Chrome not found. Please open PROJECT_OVERVIEW.html in browser and save as PDF');
        }
    }
} catch (error) {
    console.log('ℹ️  Please open PROJECT_OVERVIEW.html in your browser to generate PDF');
}

console.log('\n📌 Your project overview is ready for interviews!');
