import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

function fixFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Supabase Exact count
    content = content.replace(/\{\s*count:\s*'exact',\s*head:\s*true\s*\)/g, "{ count: 'exact', head: true })");

    // 2. Supabase order ascending
    content = content.replace(/\{\s*ascending:\s*(true|false)\s*\)/g, "{ ascending: $1 })");

    // 3. format date locale
    content = content.replace(/\{\s*locale:\s*ptBR\s*\)/g, "{ locale: ptBR })");
    // wait `ptBR )}` -> `ptBR })}`
    content = content.replace(/\{\s*locale:\s*ptBR\s*\)\}/g, "{ locale: ptBR })}");

    // 4. toLocaleString options
    content = content.replace(/\{\s*minimumFractionDigits:\s*(\d+)\s*\)/g, "{ minimumFractionDigits: $1 })");
    content = content.replace(/\{\s*minimumFractionDigits:\s*(\d+)\s*\)\}/g, "{ minimumFractionDigits: $1 })}");

    // 5. Hardcoded AdminUsuarios
    content = content.replace(/\{ \.\.\.formData, nome: e\.target\.value \)}/g, "{ ...formData, nome: e.target.value })}");
    content = content.replace(/\{ \.\.\.formData, email: e\.target\.value \)}/g, "{ ...formData, email: e.target.value })}");
    content = content.replace(/\{ \.\.\.formData, password: e\.target\.value \)}/g, "{ ...formData, password: e.target.value })}");
    content = content.replace(/\{ \.\.\.formData, role: v \)}/g, "{ ...formData, role: v })}");
    content = content.replace(/\{ \.\.\.formData, empresa_id: v, loja_id: "" \)}/g, "{ ...formData, empresa_id: v, loja_id: \"\" })}");
    content = content.replace(/\{ \.\.\.formData, loja_id: v \)}/g, "{ ...formData, loja_id: v })}");
    content = content.replace(/\{ nome: "", email: "", password: "", empresa_id: "", loja_id: "", role: "LOJA" \);/g, "{ nome: \"\", email: \"\", password: \"\", empresa_id: \"\", loja_id: \"\", role: \"LOJA\" });");

    // 6. Hardcoded Supabase update
    content = content.replace(/\.update\(\{ ativo: !currentStatus \)/g, ".update({ ativo: !currentStatus })");

    // 7. useAuth
    content = content.replace(/\{ children \}: \{ children: ReactNode \)/g, "{ children }: { children: ReactNode })");
    content = content.replace(/\(\{ data: \{ session \} \) => \{/g, "({ data: { session } }) => {");
    content = content.replace(/\{ email, password \);/g, "{ email, password });");
    content = content.replace(/options:\s*\{\s*data:\s*\{\s*nome,\s*role\s*\},\s*emailRedirectTo:\s*window\.location\.origin,\s*\},?\s*\);/g, "options: {\n                data: { nome, role },\n                emailRedirectTo: window.location.origin,\n            }\n        });");

    // 8. invoke
    content = content.replace(/invoke\('create-user',\s*\{\s*body:\s*\{\s*\.\.\.formData\s*\}\s*\);/g, "invoke('create-user', {\n                body: { ...formData }\n            });");
    content = content.replace(/invoke\('create-user',\s*\{\s*body:\s*\{\s*\.\.\.formData\s*\}\n\s*\);/g, "invoke('create-user', {\n                body: { ...formData }\n            });");

    // 9. reset password
    content = content.replace(/resetPasswordForEmail\(email,\s*\{\s*redirectTo:\s*window\.location\.origin\s*\+\s*'\/reset-password',?\s*\);/g, "resetPasswordForEmail(email, {\n            redirectTo: window.location.origin + '/reset-password',\n        });");
    content = content.replace(/resetPasswordForEmail\(email,\s*\{\s*redirectTo:\s*window\.location\.origin\s*\+\s*'\/reset-password',\n\s*\);/g, "resetPasswordForEmail(email, {\n            redirectTo: window.location.origin + '/reset-password',\n        });");

    // 10. toast methods multi-line using safe split
    if (content.includes("toast.")) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(')')) continue; // Skip if line has ')'
            if (lines[i].includes('description:')) {
                // look at next line
                if (lines[i + 1] && lines[i + 1].trim() === ');') {
                    lines[i + 1] = lines[i + 1].replace(');', '});');
                }
            }
        }
        content = lines.join('\n');
    }

    // 11. useExcelImport
    if (content.includes("useExcelImport(")) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('onSuccess:')) {
                // Look forward up to 5 lines for );
                for (let j = 1; j <= 5; j++) {
                    if (lines[i + j] && lines[i + j].trim() === ');') {
                        lines[i + j] = lines[i + j].replace(');', '});'); break;
                    }
                }
            }
        }
        content = lines.join('\n');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed ${filePath}`);
    }
}

walk('src', fixFile);
