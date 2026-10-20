/*
 * FreeCompile Local Runtime
 * Self-contained educational interpreters/translators. No remote compiler APIs.
 * This intentionally supports a documented language subset; it never claims to be
 * a standards-complete compiler for native languages.
 */
const truth = v => !!v;
function tokenize(expr) {
  const out=[]; const re=/\s*(?:(\d+(?:\.\d+)?)|("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')|([A-Za-z_$][\w$]*)|(===|!==|==|!=|<=|>=|&&|\|\||\*\*|[+\-*/%<>()!\[\],]))/gy;
  let i=0;
  while(i<expr.length){re.lastIndex=i;const m=re.exec(expr);if(!m)throw Error('Unsupported expression near: '+expr.slice(i,i+18));out.push(m[1]!==undefined?{t:'n',v:Number(m[1])}:m[2]!==undefined?{t:'s',v:m[2].slice(1,-1).replace(/\\n/g,'\n').replace(/\\t/g,'\t').replace(/\\\\/g,'\\').replace(/\\(["'])/g,'$1')} :m[3]!==undefined?{t:'id',v:m[3]}:{t:'op',v:m[4]});i=re.lastIndex;}
  return out;
}
function evaluate(expr, env) {
  const ts=tokenize(expr);let p=0;
  const peek=()=>ts[p]?.v;const take=()=>ts[p++];
  const primary=()=>{const t=take();if(!t)throw Error('Expected expression');if(t.t==='n'||t.t==='s')return t.v;if(t.t==='id'){if(t.v==='true'||t.v==='True')return true;if(t.v==='false'||t.v==='False')return false;if(t.v==='null'||t.v==='None'||t.v==='nil')return null;if(t.v==='not')return !truth(primary());if(t.v==='and')return truth(primary())&&truth(primary());if(t.v==='or')return truth(primary())||truth(primary());if(Object.hasOwn(env,t.v))return env[t.v];throw Error('Undefined variable: '+t.v)}if(t.v==='-'||t.v==='!')return t.v==='-'?-Number(primary()):!truth(primary());if(t.v==='('){const v=parse(0);if(take()?.v!==')')throw Error('Expected )');return v}if(t.v==='['){const a=[];while(peek()!==']'&&p<ts.length){a.push(parse(0));if(peek()===',')take();else break}if(take()?.v!==']')throw Error('Expected ]');return a}throw Error('Unsupported expression');};
  const prec={'or':1,'||':1,'and':2,'&&':2,'==':3,'===':3,'!=':3,'!==':3,'<':4,'>':4,'<=':4,'>=':4,'+':5,'-':5,'*':6,'/':6,'%':6,'**':7};
  const parse=min=>{let left=primary();while(p<ts.length){const op=peek();const pr=prec[op]||(ts[p]?.t==='id'&&(op==='and'||op==='or')?prec[op]:0);if(!pr||pr<min)break;take();const right=parse(pr+(op==='**'?0:1));switch(op){case '+':left=typeof left==='string'||typeof right==='string'?String(left)+String(right):Number(left)+Number(right);break;case '-':left=Number(left)-Number(right);break;case '*':left=Number(left)*Number(right);break;case '/':left=Number(left)/Number(right);break;case '%':left=Number(left)%Number(right);break;case '**':left=Number(left)**Number(right);break;case '==':case '===':left=left===right;break;case '!=':case '!==':left=left!==right;break;case '<':left=left<right;break;case '>':left=left>right;break;case '<=':left=left<=right;break;case '>=':left=left>=right;break;case 'and':case '&&':left=truth(left)&&truth(right);break;case 'or':case '||':left=truth(left)||truth(right);break;}}return left;};
  const v=parse(0);if(p<ts.length)throw Error('Unexpected token: '+peek());return v;
}
const fmt=v=>v===undefined?'undefined':v===null?'null':typeof v==='object'?JSON.stringify(v):String(v);
function pyString(expr,env){const f=expr.trim();if(/^f["']/.test(f)){const body=f.slice(2,-1);return body.replace(/\{([^{}]+)\}/g,(_,x)=>fmt(evaluate(x,env)));}return fmt(evaluate(f,env));}
function runPython(source,stdin=''){
 const lines=source.replace(/\r/g,'').split('\n'),env={__name__:'__main__'},out=[];const inputLines=String(stdin).split(/\r?\n/);let inputIndex=0;let i=0,steps=0;
 const execBlock=(indent)=>{while(i<lines.length){if(++steps>10000)throw Error('Execution limit reached (10,000 statements).');let raw=lines[i],trim=raw.trim();if(!trim||trim.startsWith('#')){i++;continue}const ind=raw.match(/^\s*/)[0].replace(/\t/g,'    ').length;if(ind<indent)return;if(ind>indent)throw Error('Unexpected indentation on line '+(i+1));if(trim==='pass'){i++;continue}
 if(trim.startsWith('print(')&&trim.endsWith(')')){const inner=trim.slice(6,-1);const parts=[];let cur='',depth=0,q='',esc=false;for(const ch of inner){if(q){cur+=ch;if(ch===q&&!esc)q='';esc=ch==='\\'&&!esc;continue}if(ch==='"'||ch==="'"){q=ch;cur+=ch;continue}if('([{'.includes(ch))depth++;if(')]}'.includes(ch))depth--;if(ch===','&&depth===0){parts.push(cur.trim());cur='';}else cur+=ch}if(cur.trim())parts.push(cur.trim());out.push(parts.map(x=>pyString(x,env)).join(' '));i++;continue}
 const forM=trim.match(/^for\s+(\w+)\s+in\s+range\(([^)]*)\)\s*:\s*$/);if(forM){i++;const bodyStart=i;let j=i;while(j<lines.length&&(!lines[j].trim()||lines[j].match(/^\s*/)[0].length>ind))j++;const block=lines.slice(bodyStart,j);const args=forM[2].split(',').map(x=>evaluate(x,env));let start=0,end=args[0],step=1;if(args.length>1){start=args[0];end=args[1]}if(args.length>2)step=args[2];if(!step)throw Error('range() step cannot be zero');for(let n=start;step>0?n<end:n>end;n+=step){env[forM[1]]=n;let bi=0;const oldLines=lines.slice();lines.splice(bodyStart,block.length,...block);i=bodyStart;execBlock(ind+4);lines.splice(0,lines.length,...oldLines);i=bodyStart+block.length;}i=j;continue}
 const ifM=trim.match(/^(if|elif)\s+(.+?)\s*:\s*$/);if(ifM){const condition=truth(evaluate(ifM[2],env));i++;const start=i;while(i<lines.length&&(!lines[i].trim()||lines[i].match(/^\s*/)[0].length>ind))i++;const end=i;if(condition)execNested(lines.slice(start,end),ind+4);if(i<lines.length&&lines[i].trim().startsWith('else:')){i++;const es=i;while(i<lines.length&&(!lines[i].trim()||lines[i].match(/^\s*/)[0].length>ind))i++;if(!condition)execNested(lines.slice(es,i),ind+4)}continue}
 const inputAssign=trim.match(/^([A-Za-z_]\w*)\s*=\s*input\((.*?)\)\s*$/);if(inputAssign){const prompt=inputAssign[2].trim();if(prompt)out.push(prompt.replace(/^['"]|['"]$/g,''));env[inputAssign[1]]=inputIndex<inputLines.length?inputLines[inputIndex++] : '';i++;continue}
 const assign=trim.match(/^(?:let\s+|const\s+|var\s+)?([A-Za-z_]\w*)\s*(?:=|\+=|-=)\s*(.+)$/);if(assign){const prev=env[assign[1]];let val=evaluate(assign[2],env);if(trim.includes('+='))val=Number(prev)+Number(val);if(trim.includes('-='))val=Number(prev)-Number(val);env[assign[1]]=val;i++;continue}
 if(trim.startsWith('import ')||trim.startsWith('from '))throw Error('Imports/packages are not available in the built-in offline interpreter (line '+(i+1)+').');
 throw Error('Offline Python runtime does not yet support this statement on line '+(i+1)+': '+trim);
 }};
 function execNested(block,indent){const returnIndex=i;const saved=lines.slice();lines.splice(0,lines.length,...block.map(x=>x.trimStart()));i=0;execBlock(0);lines.splice(0,lines.length,...saved);i=returnIndex;}
 execBlock(0);return {output:out.join('\n'),status:'success',engine:'FreeCompile Local Python',note:'Built-in offline interpreter: basic expressions, variables, print, if/else and range loops. Third-party imports are unavailable.'};
}
function stripComments(s){return s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'').replace(/^\s*#include.*$/gm,'').replace(/^\s*using\s+System\s*;?$/gm,'');}
function extractPrintArgs(s,pattern,env,out){let m;const re=new RegExp(pattern,'g');while((m=re.exec(s))){let exp=m[1].trim();if((exp.startsWith('"')&&exp.endsWith('"'))||(exp.startsWith("'")&&exp.endsWith("'"))){out.push(exp.slice(1,-1).replace(/\\n/g,'\n'));continue}try{out.push(fmt(evaluate(exp,env)))}catch{const interpolation=exp.replace(/\{([A-Za-z_]\w*)\}/g,(_,k)=>fmt(env[k]));out.push(interpolation.replace(/^["']|["']$/g,''));}}}
function runSimple(source,lang){
 let s=stripComments(source),out=[],env={};const assignRe=/(?:\b(?:int|long|short|float|double|bool|boolean|string|char|var|auto|let|const)\s+)?\$?([A-Za-z_]\w*)\s*=\s*("[^"]*"|'[^']*'|-?\d+(?:\.\d+)?|true|false|True|False|null|\w+\s*[+*/%-]\s*[-\w.]+)\s*;/g;let m;
 while((m=assignRe.exec(s))){try{env[m[1]]=evaluate(m[2],env)}catch{}}
 if(lang==='C'||lang==='C++'){const re=/printf\s*\((['"])([\s\S]*?)\1\s*(?:,\s*([\s\S]*?))?\)\s*;/g;while((m=re.exec(s))){let text=m[2].replace(/\\n/g,'\n');const args=m[3]?m[3].split(',').map(x=>{try{return evaluate(x.trim(),env)}catch{return env[x.trim()]??x.trim()}}):[];let ai=0;text=text.replace(/%[sdifc]/g,()=>fmt(args[ai++]));out.push(text)}const cout=/std::cout\s*((?:<<\s*(?:"[^"]*"|'[^']*'|\w+|\d+|std::endl)\s*)+);/g;while((m=cout.exec(s))){let t='';for(const z of m[1].matchAll(/<<\s*("[^"]*"|'[^']*'|\w+|\d+|std::endl)/g)){const v=z[1];if(v==='std::endl')t+='\n';else if((v[0]==='"'||v[0]==="'"))t+=v.slice(1,-1).replace(/\\n/g,'\n');else t+=fmt(env[v]??(Number.isFinite(Number(v))?Number(v):v));}out.push(t)}}
 else if(lang==='C#'){extractPrintArgs(s,'Console\\.(?:WriteLine|Write)\\s*\\(([\\s\\S]*?)\\)\\s*;',env,out)}
 else if(lang==='PHP'){extractPrintArgs(s,'(?:echo|print)\\s+([\\s\\S]*?);',env,out);out=out.map(x=>x.replace(/\{\$([A-Za-z_]\w*)\}/g,(_,k)=>fmt(env[k]??'')).replace(/\$([A-Za-z_]\w*)/g,(_,k)=>fmt(env[k]??'')))}
 else if(lang==='Java'){extractPrintArgs(s,'System\\.out\\.(?:println|print)\\s*\\(([\\s\\S]*?)\\)\\s*;',env,out)}
 else if(lang==='Ruby'){extractPrintArgs(s,'(?:puts|print)\\s+(.+?)(?:;|$)',env,out)}
 else if(lang==='Go'){extractPrintArgs(s,'fmt\\.(?:Println|Print|Printf)\\s*\\(([\\s\\S]*?)\\)',env,out)}
 else if(lang==='JavaScript'||lang==='TypeScript'){extractPrintArgs(s,'console\\.(?:log|info|warn|error)\\s*\\(([\\s\\S]*?)\\)\\s*;?',env,out)}
 else if(lang==='Bash'||lang==='Shell'){extractPrintArgs(s,'echo\\s+(.+?)(?:;|$)',env,out)}
 else if(lang==='R'){extractPrintArgs(s,'(?:print|cat)\\s*\\(([\\s\\S]*?)\\)',env,out)}
 else if(lang==='Lua'){extractPrintArgs(s,'print\\s*\\(([\\s\\S]*?)\\)',env,out)}
 else if(lang==='Rust'){extractPrintArgs(s,'(?:println|print)!\\s*\\(([\\s\\S]*?)\\)',env,out)}
 else if(lang==='Haskell'){extractPrintArgs(s,'(?:putStrLn|putStr)\\s+("[^"]*"|\\w+)',env,out)}
 else if(lang==='Erlang'){extractPrintArgs(s,'io:format\\s*\\(\\s*("[^"]*")',env,out)}
 else if(lang==='OCaml'){extractPrintArgs(s,'(?:print_endline|print_string)\\s+("[^"]*")',env,out)}
 else if(lang==='Objective-C'){extractPrintArgs(s,'NSLog\\s*\\(\\s*@("[^"]*")',env,out)}
 else if(lang==='Vim script'){extractPrintArgs(s,'echo\\s+(.+?)(?:;|$)',env,out)}
 else if(lang==='Perl'){extractPrintArgs(s,'print\\s+(.+?);',env,out)}
 else if(lang==='SQL'){extractPrintArgs(s,'SELECT\\s+(.+?);',env,out)}
 else {extractPrintArgs(s,'(?:print|println|puts|writeln|Put_Line|printfn)\\s*\\(?\s*([\s\S]*?)\s*\)?\s*;?',env,out)}
 if(!out.length){const nonempty=s.trim();if(!nonempty||/^(?:#include|using |import )/.test(nonempty))return {output:'Program finished. No output was produced.',status:'success',engine:'FreeCompile Local Core',note:'Offline language core: output patterns and simple values. Full language semantics and external libraries are not implemented.'};throw Error('The offline '+lang+' core could not interpret this program. Try the supported print/output syntax or use the HTML/JavaScript workspace for full browser execution.');}
 return {output:out.join(''),status:'success',engine:'FreeCompile Local '+lang,note:'Built-in offline core supports common output statements and simple values. It is not a standards-complete compiler and does not load third-party libraries.'};
}
export function runLocalCode(language,code,{stdin=''}={}) {
 if(language==='Python')return runPython(code,stdin);
 if(['C','C++','C#','PHP','Java','Ruby','Go','JavaScript','TypeScript','Bash','Shell','R','Lua','Perl','SQL','Kotlin','Swift','Rust','Haskell','Scala','D','Fortran','F#','Elixir','Erlang','Clojure','OCaml','Objective-C','Pascal','Ada','Assembly','Vim script'].includes(language))return runSimple(code,language);
 throw Error('No built-in offline runtime is registered for '+language+'.');
}
export function renderJSX(source) {
 const m=source.match(/return\s*\(?\s*([\s\S]*?)\s*\)?\s*;?\s*}/);
 if(!m)throw Error('Local JSX preview expects a component with a return (...) JSX block.');
 let jsx=m[1].trim().replace(/;$/,'');
 if(jsx.startsWith('(')&&jsx.endsWith(')'))jsx=jsx.slice(1,-1).trim();
 jsx=jsx.replace(/className=/g,'class=').replace(/\{\s*['"]([^'"]*)['"]\s*\}/g,'$1');
 if(/\{[^{}]*\}/.test(jsx))jsx=jsx.replace(/\{([^{}]+)\}/g,(_,expr)=>{const v=expr.trim();if(/^\d+(?:\.\d+)?$/.test(v))return v;if(/^["']/.test(v))return v.slice(1,-1);throw Error('Local JSX preview cannot evaluate expression: {'+v+'}. Use literal text or simple numeric/string expressions.');});
 if(/<([A-Z][A-Za-z0-9.]*)\b/.test(jsx))throw Error('Custom React components require the full React module runtime, which is not bundled in this offline build.');
 return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px system-ui;padding:2rem;color:#17251e}main{max-width:900px;margin:auto}button{padding:.6rem 1rem}</style></head><body>'+jsx+'</body></html>';
}
