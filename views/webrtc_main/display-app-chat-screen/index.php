<div <?php set_hyella_source_path( __FILE__, 1 ); ?>>
<style type="text/css">
	<?php if( file_exists( dirname( __FILE__ ).'/css/bootstrap.min.css' ) )include "css/bootstrap.min.css"; ?>
	/* MAGNIFIC POPUP */
	<?php if( file_exists( dirname( __FILE__ ).'/css/magnific-popup.css' ) )include "css/magnific-popup.css"; ?>
	<?php if( file_exists( dirname( __FILE__ ).'/css/toastr.min.css' ) )include "css/toastr.min.css"; ?>
	<?php if( file_exists( dirname( __FILE__ ).'/css/style2.css' ) )include "css/style2.css"; ?>
	<?php if( file_exists( dirname( __FILE__ ).'/css/style.css' ) )include "css/style.css"; ?>
</style>
<?php 
	//echo '<pre>';print_r( $data );echo '</pre>'; 
	include "chat-ui.php";
?>
<script type="text/javascript" >
	const currentUser = <?php echo json_encode( isset( $data[ 'current_user' ] ) ? $data[ 'current_user' ] : [''=>'']  ) ?>;
	<?php 
		// if( file_exists( dirname( __FILE__ ).'/js/jquery-3.7.1.min.js' ) )include "js/jquery-3.7.1.min.js";
		// if( file_exists( dirname( __FILE__ ).'/js/bootstrap.min.js' ) )include "js/bootstrap.min.js";
		/* MAGNIFIC POPUPJS */
		if( file_exists( dirname( __FILE__ ).'/js/jquery.magnific-popup.min.js' ) )include "js/jquery.magnific-popup.min.js"; 
		if( file_exists( dirname( __FILE__ ).'/js/toastr.min.js' ) )include "js/toastr.min.js"; 
		if( file_exists( dirname( __FILE__ ).'/js/script.js' ) )include "js/script.js"; ?>
</script>
</div>