// No import needed for node 18+

const test = async () => {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' })
    })
    const data = await res.json()
    console.log('RESULT:', data)
  } catch (err) {
    console.error('ERROR:', err.message)
  }
}

test()
