const generate = async (amount) => {
  const res = await fetch('/js/sentences.json')
  const sentences = await res.json()
  const result = []

  for (let i = 0; i < amount; i++) {
    const count = Math.floor(Math.random() * 6 + 3)
    const selected = []

    if (sentences.length < count) {
      break
    }

    for (let j = 0; j < count; j++) {
      const max = sentences.length
      const target = Math.floor(Math.random() * max)

      selected.push(`<li>${sentences[target]}</li>`)
      sentences.splice(target, 1)
    }

    selected.unshift('<ul>')
    selected.push('</ul>')

    result.push(selected.join(''))
  }

  return result.join('')
}

const init = async () => {
  document.getElementById('result').innerHTML = await generate(5)
}

init()

document.getElementById('generate').addEventListener('click', async () => {
  const amount = document.getElementById('amount').value
  document.getElementById('result').innerHTML = await generate(amount)
})
