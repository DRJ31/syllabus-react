import { Alert, Typography } from 'antd'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <Alert
      message="404 Not Found"
      type="warning"
      description={
        <Typography.Text>
          The page you request could not be found. Click <Link to="/">here</Link> to go back to homepage.
        </Typography.Text>
      }
    />
  )
}
