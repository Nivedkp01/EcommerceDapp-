import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Section from './components/Section';
import Product from './components/Product';

// ABIs
import Dappazon from './abis/Dappazon.json';

// Config
import config from './config.json';

function App() {
  const [provider, setProvider] = useState(null);
  const [dappazon, setDappazon] = useState(null);
  const [account, setAccount] = useState(null);
  const [electronics, setElectronics] = useState([]);
  const [clothing, setClothing] = useState([]);
  const [toys, setToys] = useState([]);
  const [item, setItem] = useState({});
  const [toggle, setToggle] = useState(false);
  const [loading, setLoading] = useState(true);

  const togglePop = (item) => {
    setItem(item);
    setToggle(!toggle);
  };

  const loadBlockchainData = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('No Ethereum provider detected.');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      const network = await provider.getNetwork();
      const dappazonAddress = config[network.chainId]?.dappazon?.address;

      if (!dappazonAddress) {
        throw new Error(`dappazon address not defined for network ID ${network.chainId}`);
      }

      const dappazon = new ethers.Contract(dappazonAddress, Dappazon, provider);
      setDappazon(dappazon);

      const items = [];
      for (let i = 1; i <= 9; i++) {
        const item = await dappazon.items(i);
        items.push(item);
      }

      const electronics = items.filter((item) => item.category === 'electronics');
      const clothing = items.filter((item) => item.category === 'clothing');
      const toys = items.filter((item) => item.category === 'toys');

      setElectronics(electronics);
      setClothing(clothing);
      setToys(toys);

    } catch (error) {
      console.error('Error loading blockchain data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestAccount = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('No Ethereum provider detected.');
      }

      // Check if accounts are already being requested
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);

    } catch (error) {
      if (error.message.includes('Already processing unlock')) {
        console.error('Unlock request is already in progress. Please wait.');
      } else if (error.message.includes('User rejected the request')) {
        console.error('User rejected the request for Ethereum accounts.');
      } else {
        console.error('Error requesting Ethereum accounts:', error.message);
      }
    }
  };

  useEffect(() => {
    requestAccount();
    loadBlockchainData();

    const handleChainChanged = () => {
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />

      <h2>Dappazon Best Sellers</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <Section title="Clothing & Jewelry" items={clothing} togglePop={togglePop} />
          <Section title="Electronics & Gadgets" items={electronics} togglePop={togglePop} />
          <Section title="Toys & Gaming" items={toys} togglePop={togglePop} />
        </>
      )}

      {toggle && (
        <Product item={item} provider={provider} account={account} dappazon={dappazon} togglePop={togglePop} />
      )}
    </div>
  );
}

export default App;
