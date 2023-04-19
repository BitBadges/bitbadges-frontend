import { Layout } from 'antd';
import { PRIMARY_BLUE, SECONDARY_BLUE } from '../../constants';

const { Content } = Layout;

function TermsOfServiceScreen() {
    return (
        <Layout>
            <Content
                style={{
                    background: `linear-gradient(0deg, ${SECONDARY_BLUE} 0, ${PRIMARY_BLUE} 0%)`,
                    minHeight: '100vh',
                    textAlign: 'center',
                }}
            >
                <div>

                </div>
            </Content >
        </Layout >
    );
}

export default TermsOfServiceScreen;
