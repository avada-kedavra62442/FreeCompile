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
  const callBuiltin=(name,args)=>{
    switch(name){
      case 'len': return args[0]?.length ?? (args[0]&&typeof args[0]==='object'?Object.keys(args[0]).length:0);
      case 'str': return fmt(args[0]??'');
      case 'int': {const n=Number.parseInt(args[0],10);if(Number.isNaN(n))throw Error('int() could not convert the value');return n;}
      case 'float': {const n=Number(args[0]);if(Number.isNaN(n))throw Error('float() could not convert the value');return n;}
      case 'bool': return truth(args[0]);
      case 'abs': return Math.abs(Number(args[0]));
      case 'round': return Number(Number(args[0]).toFixed(args[1]??0));
      case 'min': return Math.min(...args.map(Number));
      case 'max': return Math.max(...args.map(Number));
      case 'sum': return (args[0]||[]).reduce((a,b)=>a+Number(b),0);
      case 'range': {let start=0,end=args[0],step=1;if(args.length>1){start=args[0];end=args[1]}if(args.length>2)step=args[2];if(!Number.isFinite(Number(start))||!Number.isFinite(Number(end))||!Number.isFinite(Number(step))||Number(step)===0)throw Error('range() requires numeric arguments and a non-zero step');const out=[];for(let n=Number(start);Number(step)>0?n<Number(end):n>Number(end);n+=Number(step)){if(out.length>=10000)throw Error('range() exceeds the 10,000 item execution limit');out.push(n)}return out;}
      case 'list': return Array.isArray(args[0])?[...args[0]]:String(args[0]??'').split('');
      case 'type': return args[0]===null?'NoneType':Array.isArray(args[0])?'list':typeof args[0]==='number'?'int':typeof args[0]==='boolean'?'bool':typeof args[0]==='string'?'str':typeof args[0];
      default: throw Error('Built-in function not supported: '+name);
    }
  };
  const primary=()=>{
    const t=take();if(!t)throw Error('Expected expression');
    let value;
    if(t.t==='n'||t.t==='s')value=t.v;
    else if(t.t==='id'){
      if(t.v==='true'||t.v==='True')value=true;
      else if(t.v==='false'||t.v==='False')value=false;
      else if(t.v==='null'||t.v==='None'||t.v==='nil')value=null;
      else if(t.v==='not')value=!truth(primary());
      
      else if(peek()==='('){
        take();const args=[];while(p<ts.length&&peek()!==')'){args.push(parse(0));if(peek()===',')take();else break}if(take()?.v!==')')throw Error('Expected ) after function arguments');value=callBuiltin(t.v,args);
      } else if(Object.hasOwn(env,t.v))value=env[t.v];
      else throw Error('Undefined variable: '+t.v);
    } else if(t.t==='op'&&(t.v==='-'||t.v==='!')){value=t.v==='-'?-Number(primary()):!truth(primary());}
    else if(t.v==='('){value=parse(0);if(take()?.v!==')')throw Error('Expected )');}
    else if(t.v==='['){const a=[];while(peek()!==']'&&p<ts.length){a.push(parse(0));if(peek()===',')take();else break}if(take()?.v!==']')throw Error('Expected ]');value=a;}
    else throw Error('Unsupported expression');
    while(peek()==='['){take();const index=parse(0);if(take()?.v!==']')throw Error('Expected ] after index');if(value==null)throw Error('Cannot index an empty value');value=value[index];}
    return value;
  };
  const prec={'or':1,'||':1,'and':2,'&&':2,'==':3,'===':3,'!=':3,'!==':3,'<':4,'>':4,'<=':4,'>=':4,'in':4,'+':5,'-':5,'*':6,'/':6,'%':6,'**':7};
  const parse=min=>{
    let left=primary();
    while(p<ts.length){
      const op=peek(),pr=prec[op]||0;if(!pr||pr<min)break;take();
      if(op==='and'||op==='&&'){const right=parse(pr+1);left=truth(left)&&truth(right);continue}
      if(op==='or'||op==='||'){const right=parse(pr+1);left=truth(left)||truth(right);continue}
      const right=parse(pr+(op==='**'?0:1));
      switch(op){
        case '+':left=typeof left==='string'||typeof right==='string'?String(left)+String(right):Number(left)+Number(right);break;
        case '-':left=Number(left)-Number(right);break;case '*':left=Number(left)*Number(right);break;
        case '/':left=Number(left)/Number(right);break;case '%':left=Number(left)%Number(right);break;case '**':left=Number(left)**Number(right);break;
        case '==':case '===':left=left===right;break;case '!=':case '!==':left=left!==right;break;
        case '<':left=left<right;break;case '>':left=left>right;break;case '<=':left=left<=right;break;case '>=':left=left>=right;break;
        case 'in':left=Array.isArray(right)||typeof right==='string'?right.includes(left):right&&typeof right==='object'?Object.hasOwn(right,left):false;break;
      }
    }
    return left;
  };
  const v=parse(0);if(p<ts.length)throw Error('Unexpected token: '+peek());return v;
}
const fmt=v=>v===undefined?'undefined':v===null?'null':typeof v==='object'?JSON.stringify(v):String(v);
function pyString(expr,env){const f=expr.trim();if(/^f["']/.test(f)){const body=f.slice(2,-1);return body.replace(/\{([^{}]+)\}/g,(_,x)=>fmt(evaluate(x,env)));}return fmt(evaluate(f,env));}
function runPython(source,stdin=''){
 const lines=source.replace(/\r/g,'').split('\n'),inputLines=String(stdin).split(/\r?\n/),env={__name__:'__main__'},out=[];
 let i=0,inputIndex=0,steps=0;
 const skipTrivia=()=>{while(i<lines.length&&(!lines[i].trim()||lines[i].trim().startsWith('#')))i++};
 const indentation=line=>line.match(/^\s*/)[0].replace(/\t/g,'    ').length;
 const splitArgs=text=>{const parts=[];let cur='',depth=0,q='',esc=false;for(const ch of text){if(q){cur+=ch;if(ch===q&&!esc)q='';if(ch==='\\'&&!esc)esc=true;else esc=false;continue}if(ch==='"'||ch==="'"){q=ch;cur+=ch;continue}if('([{'.includes(ch))depth++;else if(')]}'.includes(ch))depth--;if(ch===','&&depth===0){parts.push(cur.trim());cur=''}else cur+=ch}if(cur.trim())parts.push(cur.trim());return parts};
 const parseSuite=expected=>{
   const body=[];
   while(i<lines.length){
     skipTrivia();if(i>=lines.length)break;
     const raw=lines[i],trim=raw.trim(),ind=indentation(raw);
     if(ind<expected)break;
     if(ind>expected)throw Error('Unexpected indentation on line '+(i+1));
     if(/^(elif\b|else\s*:)/.test(trim))break;
     const lineNo=i+1;let m;
     if((m=trim.match(/^if\s+(.+?)\s*:\s*$/))){
       const branches=[];i++;branches.push({condition:m[1],body:parseSuite(ind+4)});skipTrivia();
       while(i<lines.length&&indentation(lines[i])===ind){
         const next=lines[i].trim(),em=next.match(/^elif\s+(.+?)\s*:\s*$/);
         if(em){i++;branches.push({condition:em[1],body:parseSuite(ind+4)});skipTrivia();continue}
         if(/^else\s*:\s*$/.test(next)){i++;branches.push({condition:null,body:parseSuite(ind+4)});skipTrivia()}
         break;
       }
       body.push({type:'if',branches,lineNo});continue;
     }
     if((m=trim.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+?)\s*:\s*$/))){i++;body.push({type:'for',name:m[1],expr:m[2],body:parseSuite(ind+4),lineNo});continue}
     if((m=trim.match(/^while\s+(.+?)\s*:\s*$/))){i++;body.push({type:'while',expr:m[1],body:parseSuite(ind+4),lineNo});continue}
     if(trim==='pass'){i++;body.push({type:'pass',lineNo});continue}
     if(trim==='break'||trim==='continue'){i++;body.push({type:trim,lineNo});continue}
     if((m=trim.match(/^print\s*\((.*)\)\s*$/))){i++;body.push({type:'print',args:splitArgs(m[1]),lineNo});continue}
     if((m=trim.match(/^([A-Za-z_]\w*)\s*=\s*input\((.*?)\)\s*$/))){i++;body.push({type:'input',name:m[1],prompt:m[2],lineNo});continue}
     if((m=trim.match(/^([A-Za-z_]\w*)\s*(\+=|-=|\*=|\/=|=)\s*(.+)$/))){i++;body.push({type:'assign',name:m[1],op:m[2],expr:m[3],lineNo});continue}
     throw Error('Offline Python runtime does not yet support this statement on line '+lineNo+': '+trim);
   }
   return body;
 };
 const ast=parseSuite(0);
 const execute=nodes=>{
   for(const node of nodes){
     if(++steps>10000)throw Error('Execution limit reached (10,000 statements/iterations).');
     if(node.type==='pass')continue;
     if(node.type==='break')throw {kind:'break'};
     if(node.type==='continue')throw {kind:'continue'};
     if(node.type==='assign'){
       const value=evaluate(node.expr,env),prev=env[node.name];
       if(node.op==='=')env[node.name]=value;
       else if(node.op==='+=' )env[node.name]=typeof prev==='string'||typeof value==='string'?String(prev??'')+String(value):Number(prev)+Number(value);
       else if(node.op==='-=')env[node.name]=Number(prev)-Number(value);
       else if(node.op==='*=')env[node.name]=Number(prev)*Number(value);
       else env[node.name]=Number(prev)/Number(value);
       continue;
     }
     if(node.type==='input'){
       const prompt=node.prompt.trim();if(prompt){try{out.push(fmt(evaluate(prompt,env)))}catch{out.push(prompt.replace(/^['"]|['"]$/g,''))}}
       env[node.name]=inputIndex<inputLines.length?inputLines[inputIndex++] : '';continue;
     }
     if(node.type==='print'){
       let sep=' ',end='\n';const values=[];
       for(const arg of node.args){const kw=arg.match(/^(sep|end)\s*=\s*(.+)$/);if(kw){const v=pyString(kw[2],env);if(kw[1]==='sep')sep=v;else end=v}else values.push(pyString(arg,env))}
       out.push(values.join(sep)+end);continue;
     }
     if(node.type==='if'){for(const branch of node.branches){if(branch.condition===null||truth(evaluate(branch.condition,env))){execute(branch.body);break}}continue}
     if(node.type==='for'){
       const values=evaluate(node.expr,env);if(!Array.isArray(values)&&typeof values!=='string')throw Error('for loops need a list, string, or range() on line '+node.lineNo);
       for(const value of values){if(++steps>10000)throw Error('Execution limit reached (10,000 statements/iterations).');env[node.name]=value;try{execute(node.body)}catch(e){if(e?.kind==='break')break;if(e?.kind==='continue')continue;throw e}}continue;
     }
     if(node.type==='while'){
       let guard=0;while(truth(evaluate(node.expr,env))){if(++guard>10000||++steps>10000)throw Error('Execution limit reached (10,000 statements/iterations).');try{execute(node.body)}catch(e){if(e?.kind==='break')break;if(e?.kind==='continue')continue;throw e}}continue;
     }
   }
 };
 execute(ast);
 return {output:out.join(''),status:'success',engine:'FreeCompile Local Python',note:'Built-in offline Python subset: expressions, variables, built-ins, lists/indexing, print/input, if/elif/else, for/range and while. Python packages and full CPython compatibility are not bundled.'};
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
 else if(lang==='Erlang'){extractPrintArgs(s,'io:format\\s*\\(\\s*("[^"]*")',env,out);out=out.map(x=>x.replace(/~n/g,'\n'))}
 else if(lang==='OCaml'){extractPrintArgs(s,'(?:print_endline|print_string)\\s+("[^"]*")',env,out)}
 else if(lang==='Objective-C'){extractPrintArgs(s,'NSLog\\s*\\(\\s*@("[^"]*")',env,out)}
 else if(lang==='Vim script'){extractPrintArgs(s,'echo\\s+(.+?)(?:;|$)',env,out)}
 else if(lang==='Perl'){extractPrintArgs(s,'print\\s+(.+?);',env,out)}
 else if(lang==='SQL'){extractPrintArgs(s,'SELECT\\s+(.+?);',env,out)}
 else if(lang==='Kotlin'||lang==='Swift'||lang==='Scala'){extractPrintArgs(s,'(?:println|print)\\s*\\(([^()]*)\\)',env,out)}
 else if(lang==='D'||lang==='Pascal'){extractPrintArgs(s,'writeln\\s*\\(([^()]*)\\)',env,out)}
 else if(lang==='Ada'){extractPrintArgs(s,'Put_Line\\s*\\(([^()]*)\\)',env,out)}
 else if(lang==='F#'){extractPrintArgs(s,'printfn\\s+("[^"]*")',env,out)}
 else if(lang==='Elixir'){extractPrintArgs(s,'IO\\.puts\\s*\\(([^()]*)\\)',env,out)}
 else if(lang==='Clojure'){extractPrintArgs(s,'\\(println\\s+("[^"]*")\\)',env,out)}
 else if(lang==='Fortran'){extractPrintArgs(s,'print\\s*\\*\\s*,\\s*("[^"]*")',env,out)}
 else {}
 if(!out.length){return {output:'No output statement was detected. This built-in language core does not compile this program.',status:'incomplete',engine:'FreeCompile Local Core',note:'Only documented syntax subsets are interpreted. Native compilation and external libraries are not bundled.'};}
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
