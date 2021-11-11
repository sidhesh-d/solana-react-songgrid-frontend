import './App.css';
import { useEffect, useState } from 'react';

// Constants

const TEST_GIFS = [
	'https://i.redd.it/d3t66lv1yce61.jpg',
	'https://i.redd.it/hycuzfl67mn61.gif',
	'https://i.redd.it/bhfqa0xn3fl61.gif',
	'https://i.redd.it/qagyqy780bh61.gif'
]

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [testGifs, setTestGifs] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
        const { solana } = window;

        if (solana) {
            if (solana.isPhantom) {
                console.log('Phantom wallet found!');
                const response = await solana.connect({ onlyIfTrusted: true });
                console.log(
                  'Connected with Public Key:',
                  response.publicKey.toString()
                );

                /*
                * Set the user's publicKey in state to be used later!
                */
                setWalletAddress(response.publicKey.toString());
            }
        } else {
            alert('Solana object not found! Get a Phantom Wallet 👻');
        }
    } catch (error) {
        console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
        const response = await solana.connect();
        console.log('Connected with ', response.publicKey.toString());
        setWalletAddress(response.publicKey.toString());
    }
  }
  const onInputChange = (event) => {
    setInputValue(event.target.value);
  }
  const sendGif = async () => {
    if (inputValue.length > 0) {
      console.log('Gif link:', inputValue);
      var tstGifs = [...testGifs];
      console.log('tstGifs:', tstGifs);
      tstGifs.push(inputValue);
      setTestGifs(tstGifs);
      console.log('testGifs:', testGifs);
    } else {
      console.log('Empty input. Try again.');
    }
  };

  useEffect(() => {
    const onLoad = async () => {
        await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
        setTestGifs(TEST_GIFS);
    };
  }, [walletAddress]);

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );
  const renderConnectedContainer = () => (
    <div className="connected-container">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendGif();
        }}
      >
      <input type="text"
      placeholder="Enter gif link!"
      value={inputValue}
      onChange={onInputChange}/>
      <button type="submit" className="cta-button submit-gif-button">Submit</button>
      </form>
      <div className="gif-grid">
      {testGifs.map(gif => (
          <div className="gif-item" key={gif}>
          <img src={gif} alt={gif} />
          </div>
      ))}
      </div>
    </div>
  );


  return (
  <div className="App">
			{/* This was solely added for some styling fanciness */}
			<div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {/* Add the condition to show this only if we don't have a wallet address */}
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div>
          {testGifs.map(gif => (
            <p>{gif}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
