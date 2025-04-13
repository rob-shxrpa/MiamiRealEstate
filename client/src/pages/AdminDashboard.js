import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Stack,
  Alert,
  AlertIcon,
  Spinner,
  Flex,
  Badge,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { propertiesAPI, permitsAPI, poisAPI } from '../services/api';

// POI Form Component
const POIForm = ({ poi, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: poi?.name || '',
    category: poi?.category || '',
    address: poi?.address || '',
    city: poi?.city || 'Miami',
    state: poi?.state || 'FL',
    zip_code: poi?.zip_code || '',
    latitude: poi?.latitude || '',
    longitude: poi?.longitude || '',
    phone: poi?.phone || '',
    website: poi?.website || '',
    description: poi?.description || '',
  });

  const { data: categoriesData } = useQuery('poiCategories', poisAPI.getPOICategories);
  const categories = categoriesData?.data || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, id: poi?.id });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Name</FormLabel>
          <Input name="name" value={formData.name} onChange={handleChange} />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Category</FormLabel>
          <Select
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="Select category"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Address</FormLabel>
          <Input name="address" value={formData.address} onChange={handleChange} />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>City</FormLabel>
          <Input name="city" value={formData.city} onChange={handleChange} />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>State</FormLabel>
          <Input name="state" value={formData.state} onChange={handleChange} />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Zip Code</FormLabel>
          <Input name="zip_code" value={formData.zip_code} onChange={handleChange} />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Latitude</FormLabel>
          <Input
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            type="number"
            step="0.000001"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Longitude</FormLabel>
          <Input
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            type="number"
            step="0.000001"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Phone</FormLabel>
          <Input name="phone" value={formData.phone} onChange={handleChange} />
        </FormControl>

        <FormControl>
          <FormLabel>Website</FormLabel>
          <Input name="website" value={formData.website} onChange={handleChange} />
        </FormControl>

        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea name="description" value={formData.description} onChange={handleChange} />
        </FormControl>

        <Flex justify="flex-end" gap={2}>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button colorScheme="blue" type="submit">
            {poi ? 'Update' : 'Create'}
          </Button>
        </Flex>
      </Stack>
    </form>
  );
};

// POI Management Tab
const POIsTab = () => {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch POIs
  const {
    data: poisData,
    isLoading,
    isError,
    error,
  } = useQuery('admin-pois', () => poisAPI.getPOIs({ limit: 100 }));

  // Create POI mutation
  const createMutation = useMutation(poisAPI.createPOI, {
    onSuccess: () => {
      queryClient.invalidateQueries('admin-pois');
      onClose();
    },
  });

  // Update POI mutation
  const updateMutation = useMutation(poisAPI.updatePOI, {
    onSuccess: () => {
      queryClient.invalidateQueries('admin-pois');
      onClose();
    },
  });

  // Delete POI mutation
  const deleteMutation = useMutation(poisAPI.deletePOI, {
    onSuccess: () => {
      queryClient.invalidateQueries('admin-pois');
      setIsDeleting(false);
    },
  });

  const handleOpenModal = (poi = null) => {
    setSelectedPOI(poi);
    onOpen();
  };

  const handleSubmit = (formData) => {
    if (selectedPOI) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (poiId) => {
    if (window.confirm('Are you sure you want to delete this POI?')) {
      setIsDeleting(true);
      deleteMutation.mutate(poiId);
    }
  };

  const pois = poisData?.data || [];

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Points of Interest</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={() => handleOpenModal()}>
          Add New POI
        </Button>
      </Flex>

      {isLoading ? (
        <Flex justify="center" py={10}>
          <Spinner size="xl" />
        </Flex>
      ) : isError ? (
        <Alert status="error">
          <AlertIcon />
          {error?.message || 'Error loading POIs data'}
        </Alert>
      ) : pois.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text>No points of interest found</Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th>Address</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {pois.map((poi) => (
                <Tr key={poi.id}>
                  <Td>{poi.name}</Td>
                  <Td>
                    <Badge colorScheme="blue">{poi.category}</Badge>
                  </Td>
                  <Td>
                    {poi.address}, {poi.city}, {poi.state} {poi.zip_code}
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="Edit POI"
                      icon={<EditIcon />}
                      size="sm"
                      mr={2}
                      onClick={() => handleOpenModal(poi)}
                    />
                    <IconButton
                      aria-label="Delete POI"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      isLoading={isDeleting}
                      onClick={() => handleDelete(poi.id)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedPOI ? 'Edit POI' : 'Add New POI'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <POIForm
              poi={selectedPOI}
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

// Properties Tab
const PropertiesTab = () => {
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery('admin-properties', () => propertiesAPI.getProperties({ limit: 100 }));

  const properties = data?.data || [];

  return (
    <Box>
      <Heading size="md" mb={4}>Properties</Heading>

      {isLoading ? (
        <Flex justify="center" py={10}>
          <Spinner size="xl" />
        </Flex>
      ) : isError ? (
        <Alert status="error">
          <AlertIcon />
          {error?.message || 'Error loading properties data'}
        </Alert>
      ) : properties.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text>No properties found</Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Folio Number</Th>
                <Th>Address</Th>
                <Th>Property Type</Th>
                <Th>Bedrooms</Th>
                <Th>Bathrooms</Th>
                <Th>Last Sale</Th>
              </Tr>
            </Thead>
            <Tbody>
              {properties.map((property) => (
                <Tr key={property.id}>
                  <Td>{property.folio_number}</Td>
                  <Td>{property.address}, {property.city} {property.zip_code}</Td>
                  <Td>{property.property_type}</Td>
                  <Td>{property.bedrooms || 'N/A'}</Td>
                  <Td>{property.bathrooms || 'N/A'}</Td>
                  <Td>
                    {property.last_sale_date
                      ? `$${property.last_sale_price?.toLocaleString() || 'N/A'} on ${new Date(property.last_sale_date).toLocaleDateString()}`
                      : 'No sale data'}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

// Permits Tab
const PermitsTab = () => {
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery('admin-permits', () => permitsAPI.getPermits({ limit: 100 }));

  const permits = data?.data || [];

  return (
    <Box>
      <Heading size="md" mb={4}>Permits</Heading>

      {isLoading ? (
        <Flex justify="center" py={10}>
          <Spinner size="xl" />
        </Flex>
      ) : isError ? (
        <Alert status="error">
          <AlertIcon />
          {error?.message || 'Error loading permits data'}
        </Alert>
      ) : permits.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text>No permits found</Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Permit #</Th>
                <Th>Folio Number</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th>Issue Date</Th>
                <Th>Value</Th>
              </Tr>
            </Thead>
            <Tbody>
              {permits.map((permit) => (
                <Tr key={permit.id}>
                  <Td>{permit.permit_number}</Td>
                  <Td>{permit.folio_number}</Td>
                  <Td>{permit.permit_type}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        permit.status === 'Completed'
                          ? 'green'
                          : permit.status === 'In Progress'
                          ? 'blue'
                          : permit.status === 'Rejected'
                          ? 'red'
                          : 'orange'
                      }
                    >
                      {permit.status}
                    </Badge>
                  </Td>
                  <Td>
                    {permit.issue_date
                      ? new Date(permit.issue_date).toLocaleDateString()
                      : 'N/A'}
                  </Td>
                  <Td>
                    {permit.estimated_value
                      ? `$${permit.estimated_value.toLocaleString()}`
                      : 'N/A'}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  return (
    <Container maxW="container.xl" py={6}>
      <Heading size="lg" mb={6}>Admin Dashboard</Heading>

      <Tabs isLazy>
        <TabList>
          <Tab>POIs</Tab>
          <Tab>Properties</Tab>
          <Tab>Permits</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <POIsTab />
          </TabPanel>
          <TabPanel>
            <PropertiesTab />
          </TabPanel>
          <TabPanel>
            <PermitsTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default AdminDashboard; 