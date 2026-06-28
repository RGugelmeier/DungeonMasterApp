from waitress import serve
from server import create_app
import socket

def get_local_ip():
    """Returns the primary local IP address of the machine."""
    try:
        # Create a dummy socket to find the primary interface IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

app = create_app()

if __name__ == '__main__':
    local_ip = get_local_ip()
    print('\n' + '='*50)
    print('   Dungeon Master Backend is now running!')
    print(f'   Local:    http://localhost:5000')
    print(f'   Network:  http://{local_ip}:5000')
    print('='*50 + '\n')
    
    serve(app, host='0.0.0.0', port=5000)