/*********
 * made by Matthias Hurrle (@atzedent)
 */

const dpr = window.devicePixelRatio

function compile(shader, source) {
  gl.shaderSource(shader, source)
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
  }
}

let gl, programs = [],
vertices, buffer;

function setup() {
  gl = canvas.getContext("webgl2")
  const vs = gl.createShader(gl.VERTEX_SHADER)
  const vertexSource = document.querySelector('script[type="x-shader/x-vertex"]').innerText
  compile(vs, vertexSource)

  shaders = Array.from(document.querySelectorAll('script[type="x-shader/x-fragment"]')).map(e => e.innerText)
  programs = shaders.map(() => gl.createProgram())

  for (let i = 0; i < shaders.length; i++) {
    let addr = gl.createShader(gl.FRAGMENT_SHADER)
    let program = programs[i]

    compile(addr, shaders[i])
    gl.attachShader(program, vs)
    gl.attachShader(program, addr)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
    }
  }

  vertices = [
    -1.,-1.,1.,
    -1.,-1.,1.,
    -1., 1.,1.,
    -1., 1.,1.,
  ]

  buffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  for (let program of programs) {
    const position = gl.getAttribLocation(program, "position")

    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    // uniforms come here...
    program.resolution = gl.getUniformLocation(program, "resolution")
    program.time = gl.getUniformLocation(program, "time")
    program.fade = gl.getUniformLocation(program, "fade")
  }
}

function dispose() {
  if (gl) {
    const ext = gl.getExtension("WEBGL_lose_context")
    if (ext) ext.loseContext()
    gl = null
  }
}

function draw(now, program, duration) {
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  // uniforms come here...
  gl.uniform2f(program.resolution, canvas.width, canvas.height)
  gl.uniform1f(program.time, now * 1e-3)
  gl.uniform1f(program.fade, fade)

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length * .5)
}

const styleList = ["zoom", "slide", "paper"]
const wordlist = [
  ["freelancer", "", "sharp", "tools", "", "top", "skills", "", ""],
  ["deepen", "knowledge", "sharpen", "skills", "", ""],
  ["code", "daily", "hone", "skills", ""]
]

let handle, offset = 0,
iter = 0,
duration = 2500,
words = wordlist[iter % wordlist.length],
wordIndex = 0,
then = 0,
done = false,
fade = 0

function loop(now) {
  now = now - offset
  fade = speak(now)
  draw(now, programs[iter % programs.length], fade)

  if (fade >= 1) {
    offset += now
    fade = 0,
    then = 0,
    done = false,
    wordIndex = 0,
    words = wordlist[++iter % wordlist.length]
  }

  handle = requestAnimationFrame(loop)
}

function init() {
  dispose()
  setup()
  resize()
  loop(0)
}

function resize() {
  const {
    innerWidth: width,
    innerHeight: height
  } = window

  canvas.width = width * dpr
  canvas.height = height * dpr

  gl.viewport(0, 0, width * dpr, height * dpr)
}

function speak(now) {
  let timeout = duration,
  factor = 250,
  prog = iter % programs.length
  if (prog === 2) {
    timeout = 1000
    factor = 500
  }
  if (!done && (now - then) >= timeout) {
    done = now / (timeout * words.length) >= 1
    then = now
    if (wordIndex === 0) {
      titles.innerHTML = ""
    }
    const word = words[wordIndex++ % words.length]
    const span = document.createElement("span")
    span.classList.add(styleList[iter % styleList.length])
    span.dataset.text = word
    span.innerText = word
    titles.appendChild(span)
  }

  fade = now / ((timeout + factor) * words.length)

  return fade
}

window.onload = init
window.onresize = resize