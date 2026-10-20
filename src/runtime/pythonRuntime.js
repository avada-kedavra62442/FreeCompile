let pyodidePromise;
async function getRuntime(){
  if(!pyodidePromise){
    pyodidePromise=(async()=>{
      if(typeof window==='undefined')throw new Error('The embedded Python runtime requires a browser.');
      const base=new URL('pyodide/',document.baseURI);
      const moduleUrl=new URL('pyodide.mjs',base).href;
      const {loadPyodide}=await import(/* @vite-ignore */ moduleUrl);
      return loadPyodide({indexURL:base.href});
    })().catch(error=>{pyodidePromise=null;throw error});
  }
  return pyodidePromise;
}

/** Execute CPython on WebAssembly locally; no remote execution service is used. */
export async function runPythonCode(source,{stdin=''}={}){
  const pyodide=await getRuntime();
  pyodide.globals.set('__fc_source',String(source));
  pyodide.globals.set('__fc_stdin',String(stdin));
  const result=await pyodide.runPythonAsync(`
import io, sys, traceback
__fc_out = io.StringIO()
__fc_err = io.StringIO()
__fc_previous_stdout, __fc_previous_stderr, __fc_previous_stdin = sys.stdout, sys.stderr, sys.stdin
sys.stdout, sys.stderr, sys.stdin = __fc_out, __fc_err, io.StringIO(__fc_stdin)
__fc_error = None
try:
    exec(compile(__fc_source, "<freecompile>", "exec"), {"__name__": "__main__"})
except BaseException as exc:
    __fc_error = "".join(traceback.format_exception_only(type(exc), exc)).strip()
finally:
    sys.stdout, sys.stderr, sys.stdin = __fc_previous_stdout, __fc_previous_stderr, __fc_previous_stdin
{"output": __fc_out.getvalue(), "stderr": __fc_err.getvalue(), "error": __fc_error}
`);
  const value=result.toJs({dictConverter:entries=>Object.fromEntries(entries)});
  result.destroy();
  pyodide.globals.delete('__fc_source');
  pyodide.globals.delete('__fc_stdin');
  return {output:value.output||'',stderr:value.stderr||'',error:value.error||null,engine:'Embedded CPython · Pyodide/WebAssembly',note:'Executed locally in this browser using the bundled Python runtime; no hosted compiler API was called.'};
}
