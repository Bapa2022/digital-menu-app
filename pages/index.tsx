import type { NextPage, GetServerSideProps } from 'next';
import { ICategoryHome, IHomeResponse, IImage } from 'store/reducers/interfaces';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { hideProduct } from 'store/reducers/Home/creators';

import Head from 'next/head';
import Layout from 'components/Layouts/AppLayout';
import CategoryList from 'components/Home/CategoryList';
import ProductDrawer from 'components/Home/ProductDrawer';
import { Modal } from '@mantine/core';
import Image from 'next/image';
import { showMenu } from 'store/reducers/NavMenuReducer/actionCreators';

export const getServerSideProps: GetServerSideProps = async () => {
  const api = process.env.NEXT_PUBLIC_URL_API;
  const categories: ICategoryHome[] = [];

  try {
    const categoryRes = await fetch(`${api}/home`);
    const { ok, categories: data }: IHomeResponse = await categoryRes.json();
    if (ok) {
      categories.push(...data);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
  }

  return {
    props: {
      categories,
    },
  };
};

interface Props {
  categories: ICategoryHome[];
}

const Home: NextPage<Props> = ({ categories }: Props) => {
  //-----------------------------------------------------------------------
  // STORE and HOOKS
  //-----------------------------------------------------------------------
  const { productDrawerOpened } = useAppSelector(({ HomeReducer }) => HomeReducer);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [firtsTime, setFirstTime] = useState(true);
  const [modalOpened, setModaOpened] = useState(false);
  const [categoryImage, setCategoryImage] = useState<IImage | null | undefined>(null);

  //-----------------------------------------------------------------------
  // METHODS
  //-----------------------------------------------------------------------
  const showImageModal = (image: IImage) => {
    setModaOpened(true);
    setCategoryImage(image);
  };

  const hideImageModal = () => {
    setModaOpened(false);
    setCategoryImage(null);
  };

  //-----------------------------------------------------------------------
  // USE EFECCTS
  //-----------------------------------------------------------------------
  useEffect(() => {
    if (firtsTime) {
      setTimeout(() => {
        dispatch(showMenu());
      }, 2000);
    }
  }, []);

  useEffect(() => {
    // Se agrega un primer push para que el router funcione
    if (firtsTime) {
      window.history.pushState('/', '');
      router.push('/');
      setFirstTime(false);
    }

    /**
     * * Cada que muestre un producto con el drawer se agregan los eventos.
     */
    if (productDrawerOpened) {
      if (window) {
        window.history.pushState('/', '');
        router.push('/');

        router.beforePopState(() => {
          if (productDrawerOpened) {
            window.history.pushState('/', '');
            router.push('/');
            dispatch(hideProduct());
            return false;
          }
          return true;
        });

        window.onbeforeunload = (e: BeforeUnloadEvent) => {
          e.preventDefault();
          e.returnValue = '';
        };
      }
    } else {
      // * Cuando el drawer se cierra entonces se resetean los eventos.
      // * y el hook del router.
      if (window) {
        window.onbeforeunload = null;
      }
      router.beforePopState(() => true);
    }

    /**
     * * Finalmente cuando se desmonta el componente se resetean los eventos
     * * que controlan el botón de atras.
     */
    return () => {
      if (window) {
        window.onbeforeunload = null;
      }
      router.beforePopState(() => true);
    };
  }, [productDrawerOpened]);

  return (
    <Layout title="Home" categories={categories}>
      <div>
        <Head>
          <meta name="description" content="Generated by create next app" />
        </Head>

        <CategoryList categories={categories} categoryImageHandler={showImageModal} />
        <ProductDrawer />
        <Modal opened={modalOpened} onClose={hideImageModal} centered padding={0} withCloseButton={false} radius="md">
          {categoryImage && (
            <div className="block w-full overflow-hidden rounded p-1">
              <Image
                src={categoryImage?.url}
                width={categoryImage?.width}
                height={categoryImage?.height}
                layout="responsive"
                alt="Imagen de categoría"
              />
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};
export default Home;
