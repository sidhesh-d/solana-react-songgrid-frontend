import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { useEffect, useState } from 'react';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [walletAddress, setWalletAddress] = useState("");

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (!solana) {
        if (solana.phantom) {
          console.log('Phantom wallet found');

          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        console.log('Make sure you install Phantom wallet');
      }
    } catch(error) {
        console.log(error);
    }
  }

  const connectWallet = () => {
      try {
        const { solana } = window;

        if (solana) {
            const response = solana.connect();
            console.log('Connected with ', response.publicKey.toString());
            setWalletAddress(response.publicKey.toString());
        }
      } catch (error) {
        console.log(error);
      }
  }

  useEffect(() => {
    const onLoad = async () => {
        await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const renderNotConnectedContainer = () => {
    <button className="cta-button connect-wallet-button"
      onClick={connectWallet}> Connect to Wallet
    </button>
  }

  return (
    <div className="App">
      <div className="container">
          <div className={walletAddress ? 'authed-container' : 'container'}></div>
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {/* Add the condition to show this only if we don't have a wallet address */}
          {!walletAddress && renderNotConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
