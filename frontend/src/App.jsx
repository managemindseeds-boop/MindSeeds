import { useState } from 'react'
import './App.css'
import './index.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1 class="bg-red-500">
        Hello world!
      </h1>
    </>
  )
}

export default App
