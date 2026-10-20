import test from 'node:test';
import assert from 'node:assert/strict';
import {runLocalCode, renderJSX} from '../src/runtime/localRuntime.js';

test('Python: variables, f-strings, conditions and loops run locally', () => {
  const result = runLocalCode('Python', 'name = "Ada"\nfor i in range(3):\n    print(i)\nif 2 > 1:\n    print(f"Hello, {name}!")');
  assert.equal(result.output, '0\n1\n2\nHello, Ada!');
});
test('Python: input is supplied by the local runner', () => {
  assert.equal(runLocalCode('Python', 'name = input("Name?")\nprint(name)', {stdin:'Ada'}).output, 'Name?\nAda');
});
test('C printf output is interpreted locally', () => {
  assert.equal(runLocalCode('C', '#include <stdio.h>\nint main(){ printf("answer=%d\\n", 42); return 0; }').output, 'answer=42\n');
});
test('C++ stream output is interpreted locally', () => {
  assert.equal(runLocalCode('C++', '#include <iostream>\nint main(){ std::cout << "Hello " << "world"; }').output, 'Hello world');
});
test('C# Console.WriteLine works locally', () => {
  assert.equal(runLocalCode('C#', 'class Program { static void Main() { Console.WriteLine("Hello!"); } }').output, 'Hello!');
});
test('PHP variables and interpolation work locally', () => {
  assert.equal(runLocalCode('PHP', '<?php $name = "Ada"; echo "Hello, {$name}!"; ?>').output, 'Hello, Ada!');
});
test('starter output works across built-in language cores', () => {
  const samples = [
    ['Java','System.out.println("Hello, FreeCompile!");'],
    ['Ruby','puts "Hello, FreeCompile!"'],
    ['Go','fmt.Println("Hello, FreeCompile!")'],
    ['Rust','println!("Hello, FreeCompile!");'],
    ['Kotlin','println("Hello, FreeCompile!")'],
    ['Swift','print("Hello, FreeCompile!")'],
    ['TypeScript','console.log("Hello, FreeCompile!")'],
    ['R','cat("Hello, FreeCompile!\\n")'],
    ['Perl','print "Hello, FreeCompile!\\n";'],
    ['Lua','print("Hello, FreeCompile!")'],
    ['Bash','echo "Hello, FreeCompile!"'],
    ['Haskell','putStrLn "Hello, FreeCompile!"'],
    ['Scala','println("Hello, FreeCompile!")'],
    ['D','writeln("Hello, FreeCompile!");'],
    ['Fortran','print *, "Hello, FreeCompile!"'],
    ['F#','printfn "Hello, FreeCompile!"'],
    ['Elixir','IO.puts("Hello, FreeCompile!")'],
    ['Erlang','io:format("Hello, FreeCompile!~n")'],
    ['Clojure','(println "Hello, FreeCompile!")'],
    ['OCaml','print_endline "Hello, FreeCompile!"'],
    ['Objective-C','NSLog(@"Hello, FreeCompile!");'],
    ['Pascal','writeln("Hello, FreeCompile!");'],
    ['SQL',"SELECT 'Hello, FreeCompile!';"],
    ['Ada','Put_Line("Hello, FreeCompile!");'],
    ['Vim script','echo "Hello, FreeCompile!"']
  ];
  for (const [language, code] of samples) {
    assert.match(runLocalCode(language, code).output, /Hello, FreeCompile!/, language);
  }
});
test('simple React/Next JSX starter renders offline', () => {
  const html = renderJSX('export default function App() { return <main><h1>Hello, React.</h1><p>It works.</p></main>; }');
  assert.match(html, /<h1>Hello, React\.<\/h1>/);
});
