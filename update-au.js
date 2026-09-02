const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'app', 'au', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Remove import
content = content.replace(/import \{ motion \} from 'framer-motion';\n/g, '');

// Clean up state
content = content.replace(/const \[isVisible, setIsVisible\] = useState\(false\);\n/g, '');
content = content.replace(/    useEffect\(\(\) => \{\n        setIsVisible\(true\);\n    \}, \[\]\);\n\n/g, '');

// Replace <motion.div props...> with <div...>
content = content.replace(/<motion\.div[\s\S]*?className=/g, '<div\n                                className=');
content = content.replace(/<motion\.div[\s\S]*?transition=\{\{ duration: 0\.8 \}\}\n\s*>/g, '<div>');
content = content.replace(/<motion\.div[\s\S]*?transition=\{\{ duration: 0\.7 \}\}\n\s*>/g, '<div>');

// Actually a regex to dynamically replace motion.div up to className or ">" is better
content = content.replace(/<motion\.div\s+initial=[\s\S]*?transition=.*?(\n\s*className=|\n\s*>)/gm, (match, p1) => {
    return p1.includes('className') ? '<div' + p1 : '<div>';
});

// A simpler regex: find all <motion.div ...> and remove the animation props
// First replace <motion.div with <div
content = content.replace(/<motion\.div/g, '<div');
content = content.replace(/<\/motion\.div>/g, '</div>');

// Remove animation props
content = content.replace(/\s+initial=\{\{.*?\}\}/g, '');
content = content.replace(/\s+animate=\{\{.*?\}\}/g, '');
content = content.replace(/\s+whileInView=\{\{.*?\}\}/g, '');
content = content.replace(/\s+viewport=\{\{.*?\}\}/g, '');
content = content.replace(/\s+transition=\{\{.*?\}\}/g, '');

fs.writeFileSync(file, content);
console.log('Update Complete');
