import {
  Box,
  Button,
  Card,  
  CardBody, 
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
  Link,
  Spinner
} from '@chakra-ui/react';
import { Alchemy, Network } from 'alchemy-sdk';
import { useState, useEffect } from 'react';

const { VITE_API_KEY } = import.meta.env;
const ETHERSCAN = `https://etherscan.io/address/`;
const PIGGY = 'https://smart-piggies-403.s3.us-east-2.amazonaws.com/no%20piggy.avif';

function App() {
  const [connected, setConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const { ethereum } = window;
  const buttonColor = connected ? "#ab4e52" : "#00a86b";

  useEffect(() => {
    async function connect() {
      let accounts = await ethereum.request({ method: "eth_requestAccounts" }); 
      setUserAddress(accounts[0]);
    }

    if (connected) connect();

  }, [connected]);

  const handleConnect = async () => {
    if (!connected) {
      try {
        let accounts = await ethereum.request({ 
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }] 
        });
        setConnected(!connected);
      }
      catch (err) {
        console.log(err)
      }
    } 
    else {
      try {
        await ethereum.request({ 
          method: "eth_requestAccounts",
          params: [{ eth_accounts: {} }]
        });
        setConnected(!connected);
        setUserAddress("");
        setHasQueried(false);
        setResults([]);
      }
      catch (err) {
        console.log(err)
      }
    }
  };

  ethereum.on('accountsChanged', (accounts) => {
    console.log(`running handle change`);
    setUserAddress(accounts[0]);
  });

  ethereum.on('chainChanged', (chainId) => {
    // Handle the new chain.
    // Correctly handling chain changes can be complicated.
    // We recommend reloading the page unless you have good reason not to.
    console.log(`chain id changed, reloading window`);
    window.location.reload();
  });

  async function getNFTsForOwner() {
    setHasQueried(false);
    setResults([]);
    setShowSpinner(true);
    
    const config = {
      apiKey: VITE_API_KEY,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    const data = await alchemy.nft.getNftsForOwner(userAddress);
    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.ownedNfts.length; i++) {
      const tokenData = alchemy.nft.getNftMetadata(
        data.ownedNfts[i].contract.address,
        data.ownedNfts[i].tokenId
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setShowSpinner(false);
    setHasQueried(true);
  }

  let pmsg = connected ? `connected address: ${userAddress}` : `not connected`;

  console.log(pmsg);
  
  return (
    <Box w="100vw">
      <Flex w="95%" justifyContent="right">
      <Button 
        fontSize={15} 
        onClick={handleConnect} 
        mt={36} 
        bgColor={buttonColor}
      >
          {connected ? "disconnect" : "connect"}
      </Button>
      </Flex>

      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Heading mb={0} fontSize={36}>
            NFT Indexer <Image borderRadius='30px' boxSize='40px' src={PIGGY} />
          </Heading>
          <Text>
            Plug in an address and this website will return all of its NFTs!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={42}>Get all the ERC-721 tokens of this address:</Heading>
        <Input
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          placeholder="0x123....789"
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="#e6f4ef"
          fontSize={24}
        />
        <Button fontSize={20} onClick={getNFTsForOwner} mt={36} bgColor="#009b7d">
          Fetch NFTs
        </Button>

        {showSpinner && 
          <div>
            <br/>
            <Spinner boxSize={24}/>
          </div>
        }

        {hasQueried && 
          <div>
            <Heading textAlign="center" my={36}>Here are your NFTs:</Heading>
            <SimpleGrid w={'90vw'} columns={4} spacing={24}>
              {results.ownedNfts.map((e, i) => {
                return (
                  <div key={e.title}>
                    <Card
                      key={e.title}
                      variant='outline'
                    >
                      <CardBody>
                        <Link href={`${ETHERSCAN}${e.contract.address}`} isExternal>
                          <Image 
                            boxSize='100%'
                            objectFit='cover'
                            borderRadius='5px'
                            src={e.rawMetadata.image} 
                          />
                        </Link>
                        <Heading size='sm'>{e.title}</Heading>
                        <Text>Type: {e.tokenType}</Text>
                        <Text>
                          Description: 
                        </Text> 
                        <Text>
                          {e.description}
                        </Text>
                      </CardBody>
                    </Card>
                    </div>
                );
              })}
            </SimpleGrid>
          </div>}
      </Flex>
    </Box>
  );
}

export default App;

{/* <Flex
flexDir={'column'}
color="white"
bg='#787D91'
w={'20vw'}
key={i}
p={5}
borderRadius='10'
>
<Box>
  <b>Name:</b> {tokenDataObjects[i].title}&nbsp;
</Box>
<Image src={tokenDataObjects[i].rawMetadata.image} />
</Flex> */}