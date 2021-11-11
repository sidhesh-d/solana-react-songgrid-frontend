import './App.css';
import idl from './utils/idl.json';
import { useEffect, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider, web3
} from '@project-serum/anchor';
// Constants
// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
let baseAccount = Keypair.generate();

// Get our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devent.
const network = clusterApiUrl('devnet');

// Control's how we want to acknowledge when a trasnaction is "done".
const opts = {
  preflightCommitment: "processed"
}

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

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account)
      setTestGifs(account.gifList)

    } catch (error) {
      console.log("Error in getGifs: ", error)
      setTestGifs(null);
    }
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

  const createGifAccount = async () => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    console.log("ping")
    await program.rpc.startStuffOff({
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [baseAccount]
    });
    console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
    await getGifList();

  } catch(error) {
    console.log("Error creating BaseAccount account:", error)
  }
}

  useEffect(() => {
    const onLoad = async () => {
        await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
        //setTestGifs(TEST_GIFS);
        console.log('Fetching GIF list...');
        getGifList();
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
  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't be initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } else {
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
    }
  };


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
