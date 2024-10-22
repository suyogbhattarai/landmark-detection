import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import PoseDetection from './PoseDetection/PoseDetection'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
  <PoseDetection/>
    </>
  )
}

export default App
