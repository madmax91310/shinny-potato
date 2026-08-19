import { Routes, Route } from 'react-router-dom'
import Layout from './design-system/Layout'
import Home from './pages/Home'
import ComingSoon from './pages/ComingSoon'
import { TOOLS } from './tools'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        {TOOLS.map((tool) => (
          <Route
            key={tool.to}
            path={tool.to.slice(1)}
            element={<ComingSoon title={tool.title} description={tool.description} />}
          />
        ))}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
