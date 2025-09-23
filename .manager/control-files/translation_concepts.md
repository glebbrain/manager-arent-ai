# Translation Concepts Database - C/C++ to ASM

> Created: 2025-09-01
> Purpose: Systematic collection of translation patterns and concepts
> Target: MenuetOS64 FASM

## 🏗️ Core Translation Concepts

### 1. Data Type Mappings
- **Integers**: `int` → `eax/rax`, `uint32_t` → `eax`, `uint64_t` → `rax`
- **Pointers**: `void*` → `rax`, `char*` → `rax`, `int*` → `rax`
- **Arrays**: `int arr[10]` → stack allocation + base pointer
- **Structs**: `struct Point` → memory layout + field offsets
- **Unions**: `union Data` → shared memory space

### 2. Function Calling Conventions
- **cdecl**: Caller cleans stack, right-to-left parameter order
- **stdcall**: Callee cleans stack, right-to-left parameter order
- **fastcall**: First 2-4 parameters in registers, rest on stack
- **MenuetOS**: System calls via `int 0x40`, custom calling convention

### 3. Control Flow Patterns
- **If-Else**: `cmp` + conditional jumps (`je`, `jne`, `jl`, `jg`)
- **Loops**: `loop`, `jmp` with labels, counter in `ecx`
- **Switch**: Jump table, `jmp [table + index*4]`
- **Recursion**: Stack frame management, return address preservation

### 4. Memory Management
- **Stack Operations**: `push`, `pop`, `sub rsp`, `add rsp`
- **Heap Allocation**: MenuetOS memory allocation calls
- **Local Variables**: Negative offsets from `rbp`
- **Global Variables**: Direct memory addressing

### 5. String Operations
- **Length**: `repnz scasb` or manual loop with `lodsb`
- **Copy**: `rep movsb` or manual loop with `lodsb`/`stosb`
- **Compare**: `rep cmpsb` or manual loop with `cmpsb`
- **Search**: `repnz scasb` for character search

### 6. Mathematical Operations
- **Arithmetic**: `add`, `sub`, `mul`, `div`, `imul`, `idiv`
- **Bitwise**: `and`, `or`, `xor`, `not`, `shl`, `shr`
- **Floating Point**: `fadd`, `fsub`, `fmul`, `fdiv` (if FPU available)
- **Optimizations**: Use `lea` for address calculations, `inc`/`dec` for ±1

## 🔄 Translation Patterns Database

### Pattern 1: Simple Function Prologue/Epilogue
```asm
; C: int add(int a, int b) { return a + b; }
add:
    push rbp
    mov rbp, rsp
    mov eax, [rbp+16]    ; a
    add eax, [rbp+24]    ; b
    pop rbp
    ret
```

### Pattern 2: String Length Function
```asm
; C: size_t strlen(const char* s)
strlen:
    push rbp
    mov rbp, rsp
    mov rdi, [rbp+16]    ; s
    xor rcx, rcx
    dec rcx               ; rcx = -1
    xor al, al            ; al = 0 (null terminator)
    repnz scasb           ; scan until null
    not rcx               ; negate to get positive length
    dec rcx               ; subtract 1 (repnz goes one too far)
    mov rax, rcx
    pop rbp
    ret
```

### Pattern 3: Array Sum Function
```asm
; C: int sum_array(int* arr, int n)
sum_array:
    push rbp
    mov rbp, rsp
    mov rdi, [rbp+16]    ; arr
    mov ecx, [rbp+24]    ; n
    xor eax, eax          ; sum = 0
.loop:
    test ecx, ecx
    jz .done
    add eax, [rdi]
    add rdi, 4            ; next int
    dec ecx
    jmp .loop
.done:
    pop rbp
    ret
```

## 📊 Concept Categories

### Basic Operations (Priority: 🔴)
- [ ] Integer arithmetic
- [ ] Pointer operations
- [ ] Basic control flow
- [ ] Function calls

### Intermediate Operations (Priority: 🟠)
- [ ] String manipulation
- [ ] Array operations
- [ ] Struct access
- [ ] Memory allocation

### Advanced Operations (Priority: 🟡)
- [ ] Virtual functions
- [ ] Exception handling
- [ ] SIMD operations
- [ ] Interrupt handling

### MenuetOS Specific (Priority: 🔴)
- [ ] System calls (`int 0x40`)
- [ ] Window management
- [ ] File I/O
- [ ] Network operations

## 🎯 Implementation Strategy

### Phase 1: Core Patterns
1. Implement basic arithmetic functions
2. Create string operation templates
3. Build control flow patterns
4. Test with simple functions

### Phase 2: Complex Patterns
1. Add struct/union support
2. Implement array operations
3. Create recursion patterns
4. Add optimization templates

### Phase 3: MenuetOS Integration
1. System call wrappers
2. Memory management
3. Interrupt handling
4. Performance optimization

## 📈 Quality Metrics

### Translation Accuracy
- Functional equivalence: 100%
- Performance: ≥90% of C/C++ baseline
- Size: ≤120% of C/C++ baseline
- Memory usage: ≤110% of C/C++ baseline

### Code Quality
- Readability: Clear labels and comments
- Maintainability: Consistent structure
- Debugging: Proper stack frames
- Documentation: Inline explanations

## 🔧 Tools & Validation

### Translation Tools
- Clang/LLVM for C/C++ compilation
- objdump for disassembly
- Custom FASM templates
- Automated testing framework

### Validation Methods
- Unit tests for each function
- Performance benchmarking
- Memory usage analysis
- Cross-platform compatibility
- MenuetOS integration testing

## 📚 References & Resources

### x86-64 Assembly
- Intel x86-64 Architecture Manual
- AMD64 Architecture Manual
- NASM/FASM documentation

### MenuetOS Development
- MenuetOS API documentation
- System call reference
- Memory layout specifications
- Interrupt handling guide

### Optimization Techniques
- Agner Fog's optimization guides
- Intel optimization manual
- AMD optimization guide
- MenuetOS-specific optimizations
