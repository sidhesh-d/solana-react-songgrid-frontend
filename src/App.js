import './App.css';
import idl from './utils/idl.json';
import { useEffect, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider, web3, BN
} from '@project-serum/anchor';
import kp from './keypair.json'

// Constants
// SystemProgram is a reference to the Solana runtime!
const { SystemProgram } = web3;

// Create a keypair for the account that will hold the Song data.
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Get our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devent.
const network = clusterApiUrl('devnet');

// Control's how we want to acknowledge when a trasnaction is "done".
const opts = {
  preflightCommitment: "processed"
}

//amount sent to users
const beerMoney = 100000000;

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [testSongs, setTestSongs] = useState([]);

  const checkIfWalletIsConnected = async () => {
    console.log(baseAccount);
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

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const getSongList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account)
      setTestSongs(account.songList)

    } catch (error) {
      console.log("Error in getSongs: ", error)
      setTestSongs(null);
    }
  }

  const sendSong = async () => {
    if (inputValue.length > 0 &&
      inputValue.includes('https') &&
      inputValue.includes('spotify')) {
      console.log('Song link:', inputValue);
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.addSong(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      await getSongList();
    } else {
      alert("That doesn't look like a spotify link");
    }
  };

  const createSongAccount = async () => {
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
      await getSongList();

    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
}

  const upvoteSong = async (song_link) => {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    await program.rpc.upvoteSong(song_link, {
      accounts: {
        baseAccount: baseAccount.publicKey,
      },
    });
    await getSongList();
  }

  const sendSol = async (to_address_str) => {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    const to_address = new PublicKey(to_address_str);
    const amount = new BN(parseInt(beerMoney));
    const transaction = await program.rpc.sendSol(amount, {
      accounts: {
        from: provider.wallet.publicKey,
        to: to_address,
        systemProgram: SystemProgram.programId,
      }
    });
    console.log('Sent beer money to '+to_address);
    console.log('transaction '+transaction);
  }

  const onInputChange = (event) => {
    setInputValue(event.target.value);
  }

  const formatAddress = (address) => {
    //return first five chars and last five chars of the address
    return address.substring(1,5) + '...' + address.substring(address.length-5)
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
      console.log('Fetching Song list...');
      getSongList()
    }
  }, [walletAddress]);// eslint-disable-line react-hooks/exhaustive-deps

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
  if (testSongs === null) {
    return (
      <div className="connected-container">
        <button className="cta-button submit-gif-button" onClick={createSongAccount}>
          Do One-Time Initialization For Song Grid Program Account
        </button>
      </div>
    )
  }
	// Otherwise, we're good! Account exists. User can submit Songs.
	else {
    return(
      <div className="connected-container">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendSong();
          }}
        >
          <input
            type="text"
            placeholder="Add a spotify link!"
            value={inputValue}
            onChange={onInputChange}
          />
          <button type="submit" className="cta-button submit-gif-button">
            Add a choon <span >&#127925;</span>
          </button>
        </form>
        <div className="gif-grid">
					{/* We use index as the key instead, also, the src is now item.SongLink */}
          {testSongs.map((item, index) => (
            <div className="gif-item" key={index}>
            <iframe src={item.songLink}  frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
            <div className="item-details">

              <div className="item-like">
                <span className="author-container">Submitted by <span className="author"> {formatAddress(item.userAddress.toString())}</span></span>
                <a  href="#" onClick={() => upvoteSong(item.songLink)}>&#128155;</a>
                <span>{item.upvotes.toString()}</span>
              </div>
              <button className="beer" onClick={() => sendSol(item.userAddress.toString())}>Buy <span className="author-btn">{formatAddress(item.userAddress.toString())}</span> a <span>&#127866;</span></button>
            </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
}

  return (
  <div className="App">
			{/* This was solely added for some styling fanciness */}
			<div className={walletAddress ? 'authed-container' : 'container'}>

        <div className="header-container">
          <p className="header">&#127911; Crypto Grooves</p>
          <div><img src="https://media.tenor.com/images/9290509b91c6a9517f83e204802a2aa2/tenor.gif" width="100px" height="100px"></img></div>
          <p className="sub-text">
            Jive to these choonz while building the metaverse &#10024;
          </p>
          {/* Add the condition to show this only if we don't have a wallet address */}
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
      </div>
    </div>
  );
};

export default App;
