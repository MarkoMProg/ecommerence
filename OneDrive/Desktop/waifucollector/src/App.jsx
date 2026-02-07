import { useState, useEffect} from 'react'
import io from 'socket.io-client'

import './styles/game.css'
import './styles/player.css'
import './styles/ui.css'

function App() {
    const [socket, setSocket] = useState(null);
    const [players, setPlayers] = useState([]);
    const [connected, setConnected] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [gameStarted, setGameStarted] = useState(false);


    useEffect(() =>{

        const newSocket = io('http://localhost:3001');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to the Server!');
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from the Server!');
            setConnected(false);
        });

        newSocket.on('current-players', (currentPlayers) =>{
            setPlayers(currentPlayers);
        });

        newSocket.on('player-joined', (newPlayer) =>{
            setPlayers(prev => [...prev, newPlayer]);
        });

        newSocket.on('player-left', (playerId) => {
            setPlayers(prev => prev.filter(player => player.id != playerId));
        });

        return () => newSocket.close();
    },[])

    const joinGame = () => {
        if(socket && playerName.trim()){
            socket.emit('join-game', playerName.trim());
            setGameStarted(true);
        }
    }

    if(!connected){
        return(
            <div className='connecting-screen'>
                Connecting to server...
            </div>
        )
    }

    if(!gameStarted){
        return(
            <div className='join-screen'>
                <h1>Waifu Collector</h1>
                <input 
                type='text' 
                placeholder='Enter your Name' 
                value={playerName} 
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinGame()}
                />
                <button onClick={joinGame}>
                    Join Game
                </button>
            </div>
        );
    }

    console.log("Game component loading..");
  return (
   <div className='game-container'>
    {/* Render all players*/}
    {players.map((player) =>(
        <div 
            key={player.id}
            className='player'
            style={{
                left: `${player.x}px`,
                top: `${player.y}px`,
                backgroundColor: player.color,
            }}
        
        >
            {player.name.charAt(0).toUpperCase()}
        </div>
    ))}

    {/*Game UI*/}
    <div className='game-ui'>
        <div className='player-count'>Players online: {players.length}</div>
    </div>
   </div>
  )
}

export default App